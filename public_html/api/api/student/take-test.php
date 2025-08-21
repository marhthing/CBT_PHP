<?php

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed();
}

try {
    // Start session early
    session_start();

    $auth = new Auth();
    $user = $auth->requireRole('student');

    $database = new Database();
    $db = $database->getConnection();

    // Get test code from URL parameter
    $test_code = $_GET['test_code'] ?? '';

    if (empty($test_code)) {
        Response::validationError('Test code is required');
    }

    // Get test information and validate
    $stmt = $db->prepare("
        SELECT tc.id, tc.code, tc.title, s.name as subject, tc.class_level, tc.duration_minutes, tc.total_questions as question_count, tc.is_active, tc.expires_at, tc.subject_id, tc.term_id, tc.session_id, tc.status, tc.used_by
        FROM test_codes tc
        LEFT JOIN subjects s ON tc.subject_id = s.id
        WHERE tc.code = ? AND tc.is_active = 1 AND tc.is_activated = 1 AND tc.status = 'using'
    ");

    error_log("Executing test lookup query with test_code: " . $test_code);
    $stmt->execute([$test_code]);
    $test = $stmt->fetch();
    error_log("Test lookup result: " . ($test ? json_encode($test) : 'null'));

    if (!$test) {
        Response::notFound('Test code not found, expired, or not in "using" status');
    }

    // Verify the student trying to take the test is the same one who validated it
    if ($test['used_by'] != $user['id']) {
        Response::unauthorized('This test code was validated by another student');
    }

    // Check if student has already taken this test
    $check_stmt = $db->prepare("
        SELECT id FROM test_results 
        WHERE test_code_id = ? AND student_id = ?
    ");

    error_log("Executing test results check with test_id: " . $test['id'] . ", user_id: " . $user['id']);
    $check_stmt->execute([(int)$test['id'], (int)$user['id']]);

    if ($check_stmt->fetch()) {
        Response::error('You have already completed this test', 409);
    }

    // Get random questions for the test with correct answers for shuffling
    $random_order = $database->getRandomOrder();
    error_log("Random order function returned: " . $random_order);

    $sql_query = "
        SELECT id, question_text, option_a, option_b, option_c, option_d, question_type, correct_answer
        FROM questions 
        WHERE subject_id = ? AND class_level = ? AND term_id = ? AND session_id = ?
        ORDER BY $random_order
        LIMIT ?
    ";
    error_log("Full SQL query: " . $sql_query);

    $questions_stmt = $db->prepare($sql_query);

    $params = [
        (int)$test['subject_id'], 
        $test['class_level'], 
        (int)$test['term_id'], 
        (int)$test['session_id'], 
        (int)$test['question_count']
    ];
    error_log("Query parameters: " . json_encode($params));

    try {
        $questions_stmt->execute($params);
        error_log("Questions query executed successfully");
    } catch (Exception $e) {
        error_log("Questions query failed: " . $e->getMessage());
        error_log("SQL Query that failed: " . $sql_query);
        error_log("Parameters that failed: " . json_encode($params));
        throw $e;
    }
    $raw_questions = $questions_stmt->fetchAll();

    if (count($raw_questions) < (int)$test['question_count']) {
        Response::error('Insufficient questions available for this test. Found ' . count($raw_questions) . ' questions, but test requires ' . $test['question_count'] . ' questions.');
    }

    // Shuffle options for each question and create answer mapping
    $questions = [];
    $answer_mappings = [];

    foreach ($raw_questions as $question) {
        // Handle True/False questions differently to avoid shuffling empty options
        if ($question['question_type'] === 'true_false') {
            // For True/False questions, only shuffle A and B options
            $original_options = [
                'A' => $question['option_a'],
                'B' => $question['option_b']
            ];

            // Get the values and shuffle them
            $option_values = array_values($original_options);
            shuffle($option_values);

            // Create new shuffled mapping for True/False
            $shuffled_options = [
                'A' => $option_values[0],
                'B' => $option_values[1],
                'C' => null,
                'D' => null
            ];

            // Find where the correct answer ended up after shuffling
            $original_correct_answer = $question['correct_answer'];
            $original_correct_text = $original_options[$original_correct_answer];

            $new_correct_answer = 'A';
            foreach ($shuffled_options as $new_key => $text) {
                if ($text === $original_correct_text) {
                    $new_correct_answer = $new_key;
                    break;
                }
            }
        } else {
            // For multiple choice questions, shuffle all four options
            $original_options = [
                'A' => $question['option_a'],
                'B' => $question['option_b'], 
                'C' => $question['option_c'],
                'D' => $question['option_d']
            ];

            // Filter out empty options before shuffling
            $valid_options = array_filter($original_options, function($value) {
                return !empty(trim($value));
            });

            // Get the values and shuffle them
            $option_values = array_values($valid_options);
            shuffle($option_values);

            // Create new shuffled mapping, filling available slots
            $shuffled_options = [
                'A' => $option_values[0] ?? null,
                'B' => $option_values[1] ?? null,
                'C' => $option_values[2] ?? null,
                'D' => $option_values[3] ?? null
            ];

            // Find where the correct answer ended up after shuffling
            $original_correct_answer = $question['correct_answer'];
            $original_correct_text = $original_options[$original_correct_answer];

            $new_correct_answer = 'A';
            foreach ($shuffled_options as $new_key => $text) {
                if ($text === $original_correct_text) {
                    $new_correct_answer = $new_key;
                    break;
                }
            }
        }

        // Store the answer mapping for this question (for submission validation)
        $answer_mappings[$question['id']] = $new_correct_answer;

        // Add processed question to final array
        $questions[] = [
            'id' => $question['id'],
            'question_text' => $question['question_text'],
            'option_a' => $shuffled_options['A'],
            'option_b' => $shuffled_options['B'],
            'option_c' => $shuffled_options['C'], 
            'option_d' => $shuffled_options['D'],
            'question_type' => $question['question_type']
        ];
    }

    // Store answer mappings in session for later validation during submission
    $_SESSION['answer_mappings_' . $test['id'] . '_' . $user['id']] = $answer_mappings;

    Response::logRequest('student/take-test', 'GET', $user['id']);

    Response::success('Test data retrieved', [
        'id' => $test['id'],
        'title' => $test['title'],
        'subject' => $test['subject'],
        'class_level' => $test['class_level'],
        'duration_minutes' => $test['duration_minutes'],
        'questions' => $questions
    ]);

} catch (Exception $e) {
    error_log("Take test error: " . $e->getMessage());
    error_log("Take test error trace: " . $e->getTraceAsString());
    if (isset($test)) {
        error_log("Test data: " . json_encode($test));
    }
    if (isset($user)) {
        error_log("User data: " . json_encode($user));
    }
    Response::serverError('Failed to load test: ' . $e->getMessage());
}

?>