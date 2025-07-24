<?php
session_start();
require_once '../includes/functions.php';
validateRole(['student']);

$testCode = $_GET['code'] ?? '';
if (empty($testCode)) {
    header('Location: take_test.php');
    exit();
}

// Get test details
$query = "SELECT tc.*, c.name as class_name, s.name as subject_name 
          FROM test_codes tc
          JOIN classes c ON tc.class_id = c.id
          JOIN subjects s ON tc.subject_id = s.id
          WHERE tc.code = ? AND tc.active = true";
$test = $db->fetch($query, [$testCode]);

if (!$test) {
    header('Location: take_test.php?error=Invalid test code');
    exit();
}

// Check if student has already taken this test
$query = "SELECT id FROM test_results WHERE student_id = ? AND test_code_id = ?";
$existingResult = $db->fetch($query, [$_SESSION['user_id'], $test['id']]);

if ($existingResult) {
    header('Location: result.php?id=' . $existingResult['id']);
    exit();
}

// Create test session
$sessionId = uniqid('test_', true);
$_SESSION['test_session'] = [
    'id' => $sessionId,
    'test_code_id' => $test['id'],
    'start_time' => time(),
    'duration' => $test['duration'] * 60, // Convert to seconds
    'end_time' => time() + ($test['duration'] * 60)
];

// Get questions for this test
$query = "SELECT * FROM questions 
          WHERE class_id = ? AND subject_id = ? AND session = ? AND term = ? AND test_type = ?
          ORDER BY RANDOM()
          LIMIT ?";
$questions = $db->fetchAll($query, [
    $test['class_id'], 
    $test['subject_id'], 
    $test['session'], 
    $test['term'], 
    $test['test_type'],
    $test['num_questions']
]);

if (empty($questions)) {
    header('Location: take_test.php?error=No questions available for this test');
    exit();
}

// Shuffle questions and options for this student
$shuffledQuestions = [];
foreach ($questions as $index => $question) {
    $shuffled = shuffleOptions($question);
    $shuffledQuestions[] = [
        'id' => $question['id'],
        'question_number' => $index + 1,
        'question_text' => $question['question_text'],
        'image' => $question['image'],
        'options' => $shuffled['options'],
        'correct_option' => $shuffled['correct_option'],
        'original_correct' => $shuffled['original_correct']
    ];
}

$_SESSION['test_questions'] = $shuffledQuestions;

$page_title = 'Test in Progress';
$include_timer = true;
include '../includes/header.php';
?>

<div class="row">
    <!-- Test Header -->
    <div class="col-12">
        <div class="card border-primary mb-3">
            <div class="card-header bg-primary text-white">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h5 class="mb-0">
                            <i class="fas fa-edit me-2"></i>
                            <?php echo htmlspecialchars($test['subject_name']); ?> - <?php echo htmlspecialchars($test['test_type']); ?>
                        </h5>
                        <small>Test Code: <?php echo htmlspecialchars($test['code']); ?></small>
                    </div>
                    <div class="col-md-4 text-md-end">
                        <div id="timer" class="fs-4 fw-bold">
                            <i class="fas fa-clock me-2"></i>
                            <span id="time-display"><?php echo formatTime($test['duration'] * 60); ?></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Questions -->
    <div class="col-md-8">
        <form id="test-form">
            <input type="hidden" name="test_code_id" value="<?php echo $test['id']; ?>">
            <input type="hidden" name="session_id" value="<?php echo $sessionId; ?>">
            
            <?php foreach ($shuffledQuestions as $index => $q): ?>
                <div class="card mb-4 question-card" id="question-<?php echo $index; ?>" 
                     style="<?php echo $index > 0 ? 'display: none;' : ''; ?>">
                    <div class="card-header">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">Question <?php echo $q['question_number']; ?> of <?php echo count($shuffledQuestions); ?></h6>
                            <span class="badge bg-info"><?php echo $test['score_per_question']; ?> marks</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <?php if ($q['image']): ?>
                            <div class="text-center mb-3">
                                <img src="../uploads/<?php echo htmlspecialchars($q['image']); ?>" 
                                     class="img-fluid rounded" 
                                     style="max-height: 300px;"
                                     alt="Question Image">
                            </div>
                        <?php endif; ?>
                        
                        <p class="fs-6 mb-4"><?php echo nl2br(htmlspecialchars($q['question_text'])); ?></p>
                        
                        <div class="row">
                            <?php 
                            $optionLabels = ['A', 'B', 'C', 'D'];
                            foreach ($q['options'] as $optIndex => $option): 
                            ?>
                                <div class="col-md-6 mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" 
                                               type="radio" 
                                               name="answer_<?php echo $q['id']; ?>" 
                                               id="q<?php echo $q['id']; ?>_<?php echo $optionLabels[$optIndex]; ?>"
                                               value="<?php echo $optionLabels[$optIndex]; ?>">
                                        <label class="form-check-label w-100" 
                                               for="q<?php echo $q['id']; ?>_<?php echo $optionLabels[$optIndex]; ?>">
                                            <strong><?php echo $optionLabels[$optIndex]; ?>.</strong> 
                                            <?php echo htmlspecialchars($option); ?>
                                        </label>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
            
            <!-- Navigation -->
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <button type="button" id="prev-btn" class="btn btn-outline-secondary" disabled>
                            <i class="fas fa-arrow-left me-2"></i>Previous
                        </button>
                        <button type="button" id="next-btn" class="btn btn-primary">
                            Next<i class="fas fa-arrow-right ms-2"></i>
                        </button>
                        <button type="button" id="submit-btn" class="btn btn-success" style="display: none;">
                            <i class="fas fa-check me-2"></i>Submit Test
                        </button>
                    </div>
                </div>
            </div>
        </form>
    </div>
    
    <!-- Question Navigator -->
    <div class="col-md-4">
        <div class="card sticky-top" style="top: 20px;">
            <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-list me-2"></i>Question Navigator</h6>
            </div>
            <div class="card-body">
                <div class="row g-2" id="question-navigator">
                    <?php foreach ($shuffledQuestions as $index => $q): ?>
                        <div class="col-3">
                            <button type="button" 
                                    class="btn btn-outline-primary btn-sm w-100 nav-btn" 
                                    data-question="<?php echo $index; ?>">
                                <?php echo $q['question_number']; ?>
                            </button>
                        </div>
                    <?php endforeach; ?>
                </div>
                
                <hr>
                
                <div class="d-grid">
                    <button type="button" id="finish-btn" class="btn btn-warning">
                        <i class="fas fa-flag-checkered me-2"></i>Finish Test
                    </button>
                </div>
                
                <div class="mt-3">
                    <small class="text-muted">
                        <i class="fas fa-save me-1"></i>
                        Auto-saving every 10 seconds
                    </small>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Submit Confirmation Modal -->
<div class="modal fade" id="submitModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Submit Test</h5>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to submit your test? You cannot make changes after submission.</p>
                <div id="submit-summary"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Continue Test</button>
                <button type="button" id="confirm-submit" class="btn btn-success">Submit Now</button>
            </div>
        </div>
    </div>
</div>

<script>
// Test session data
const testSession = {
    duration: <?php echo $test['duration'] * 60; ?>,
    startTime: <?php echo $_SESSION['test_session']['start_time']; ?>,
    totalQuestions: <?php echo count($shuffledQuestions); ?>,
    testCodeId: <?php echo $test['id']; ?>,
    sessionId: '<?php echo $sessionId; ?>'
};

let currentQuestion = 0;
let answers = {};
let autoSaveInterval;

// Initialize test
$(document).ready(function() {
    initializeTest();
    startTimer();
    startAutoSave();
});

function initializeTest() {
    updateNavigationButtons();
    updateQuestionNavigator();
    
    // Navigation button events
    $('#prev-btn').click(() => navigateQuestion(-1));
    $('#next-btn').click(() => navigateQuestion(1));
    $('#submit-btn, #finish-btn').click(showSubmitModal);
    $('#confirm-submit').click(submitTest);
    
    // Question navigator events
    $('.nav-btn').click(function() {
        const questionIndex = parseInt($(this).data('question'));
        showQuestion(questionIndex);
    });
    
    // Answer change events
    $('input[type="radio"]').change(function() {
        const questionId = $(this).attr('name').replace('answer_', '');
        const answer = $(this).val();
        answers[questionId] = answer;
        updateQuestionNavigator();
    });
}

function startTimer() {
    const endTime = testSession.startTime + testSession.duration;
    
    function updateTimer() {
        const now = Math.floor(Date.now() / 1000);
        const remaining = endTime - now;
        
        if (remaining <= 0) {
            // Time's up - auto submit
            autoSubmitTest();
            return;
        }
        
        $('#time-display').text(formatTime(remaining));
        
        // Warning colors
        if (remaining <= 300) { // 5 minutes
            $('#timer').removeClass('text-warning').addClass('text-danger');
        } else if (remaining <= 600) { // 10 minutes
            $('#timer').removeClass('text-danger').addClass('text-warning');
        }
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
}

function startAutoSave() {
    autoSaveInterval = setInterval(saveAnswers, 10000); // Save every 10 seconds
}

function saveAnswers() {
    if (Object.keys(answers).length === 0) return;
    
    $.ajax({
        url: '../ajax/save_answer.php',
        method: 'POST',
        data: {
            session_id: testSession.sessionId,
            answers: JSON.stringify(answers)
        },
        success: function(response) {
            console.log('Answers saved');
        },
        error: function() {
            console.error('Failed to save answers');
        }
    });
}

function navigateQuestion(direction) {
    const newIndex = currentQuestion + direction;
    if (newIndex >= 0 && newIndex < testSession.totalQuestions) {
        showQuestion(newIndex);
    }
}

function showQuestion(index) {
    $('.question-card').hide();
    $(`#question-${index}`).show();
    currentQuestion = index;
    updateNavigationButtons();
    updateQuestionNavigator();
}

function updateNavigationButtons() {
    $('#prev-btn').prop('disabled', currentQuestion === 0);
    
    if (currentQuestion === testSession.totalQuestions - 1) {
        $('#next-btn').hide();
        $('#submit-btn').show();
    } else {
        $('#next-btn').show();
        $('#submit-btn').hide();
    }
}

function updateQuestionNavigator() {
    $('.nav-btn').each(function() {
        const questionIndex = parseInt($(this).data('question'));
        const $btn = $(this);
        
        $btn.removeClass('btn-primary btn-success btn-outline-primary');
        
        if (questionIndex === currentQuestion) {
            $btn.addClass('btn-primary');
        } else {
            // Check if question is answered
            const questionCard = $(`#question-${questionIndex}`);
            const answered = questionCard.find('input[type="radio"]:checked').length > 0;
            
            if (answered) {
                $btn.addClass('btn-success');
            } else {
                $btn.addClass('btn-outline-primary');
            }
        }
    });
}

function showSubmitModal() {
    const answered = Object.keys(answers).length;
    const total = testSession.totalQuestions;
    
    $('#submit-summary').html(`
        <div class="alert alert-info">
            <strong>Summary:</strong><br>
            Answered: ${answered} out of ${total} questions<br>
            Unanswered: ${total - answered} questions
        </div>
    `);
    
    new bootstrap.Modal(document.getElementById('submitModal')).show();
}

function submitTest() {
    clearInterval(autoSaveInterval);
    
    $.ajax({
        url: '../ajax/submit_test.php',
        method: 'POST',
        data: {
            session_id: testSession.sessionId,
            test_code_id: testSession.testCodeId,
            answers: JSON.stringify(answers)
        },
        success: function(response) {
            if (response.success) {
                window.location.href = 'result.php?id=' + response.result_id;
            } else {
                alert('Error submitting test: ' + response.message);
            }
        },
        error: function() {
            alert('Failed to submit test. Please try again.');
        }
    });
}

function autoSubmitTest() {
    alert('Time is up! Your test will be submitted automatically.');
    submitTest();
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// Prevent page refresh/back button
window.addEventListener('beforeunload', function(e) {
    e.preventDefault();
    e.returnValue = 'Are you sure you want to leave? Your test progress may be lost.';
});

// Disable right-click and certain keyboard shortcuts
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || 
        (e.ctrlKey && e.shiftKey && e.key === 'C') || (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
    }
});
</script>

<?php include '../includes/footer.php'; ?>
