-- PostgreSQL Database Schema for CBT Portal
-- Generated: August 3, 2025 at 11:20 AM
-- Extracted from database: neondb

--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.test_results DROP CONSTRAINT IF EXISTS test_results_test_code_id_fkey;
ALTER TABLE IF EXISTS ONLY public.test_results DROP CONSTRAINT IF EXISTS test_results_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.test_codes DROP CONSTRAINT IF EXISTS test_codes_term_id_fkey;
ALTER TABLE IF EXISTS ONLY public.test_codes DROP CONSTRAINT IF EXISTS test_codes_subject_id_fkey;
ALTER TABLE IF EXISTS ONLY public.test_codes DROP CONSTRAINT IF EXISTS test_codes_session_id_fkey;
ALTER TABLE IF EXISTS ONLY public.test_codes DROP CONSTRAINT IF EXISTS test_codes_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.test_answers DROP CONSTRAINT IF EXISTS test_answers_result_id_fkey;
ALTER TABLE IF EXISTS ONLY public.test_answers DROP CONSTRAINT IF EXISTS test_answers_question_id_fkey;
ALTER TABLE IF EXISTS ONLY public.teacher_assignments DROP CONSTRAINT IF EXISTS teacher_assignments_term_id_fkey;
ALTER TABLE IF EXISTS ONLY public.teacher_assignments DROP CONSTRAINT IF EXISTS teacher_assignments_teacher_id_fkey;
ALTER TABLE IF EXISTS ONLY public.teacher_assignments DROP CONSTRAINT IF EXISTS teacher_assignments_subject_id_fkey;
ALTER TABLE IF EXISTS ONLY public.teacher_assignments DROP CONSTRAINT IF EXISTS teacher_assignments_session_id_fkey;
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS questions_term_id_fkey;
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS questions_teacher_id_fkey;
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS questions_subject_id_fkey;
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS questions_session_id_fkey;
DROP INDEX IF EXISTS public.idx_users_username;
DROP INDEX IF EXISTS public.idx_users_role;
DROP INDEX IF EXISTS public.idx_users_reg_number;
DROP INDEX IF EXISTS public.idx_test_results_test_code;
DROP INDEX IF EXISTS public.idx_test_results_student;
DROP INDEX IF EXISTS public.idx_test_codes_subject_class;
DROP INDEX IF EXISTS public.idx_teacher_assignments_teacher;
DROP INDEX IF EXISTS public.idx_questions_teacher;
DROP INDEX IF EXISTS public.idx_questions_subject_class;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_reg_number_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.test_results DROP CONSTRAINT IF EXISTS test_results_pkey;
ALTER TABLE IF EXISTS ONLY public.test_codes DROP CONSTRAINT IF EXISTS test_codes_pkey;
ALTER TABLE IF EXISTS ONLY public.test_codes DROP CONSTRAINT IF EXISTS test_codes_code_key;
ALTER TABLE IF EXISTS ONLY public.test_answers DROP CONSTRAINT IF EXISTS test_answers_pkey;
ALTER TABLE IF EXISTS ONLY public.terms DROP CONSTRAINT IF EXISTS terms_pkey;
ALTER TABLE IF EXISTS ONLY public.terms DROP CONSTRAINT IF EXISTS terms_name_key;
ALTER TABLE IF EXISTS ONLY public.teacher_assignments DROP CONSTRAINT IF EXISTS teacher_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.subjects DROP CONSTRAINT IF EXISTS subjects_pkey;
ALTER TABLE IF EXISTS ONLY public.subjects DROP CONSTRAINT IF EXISTS subjects_name_key;
ALTER TABLE IF EXISTS ONLY public.subjects DROP CONSTRAINT IF EXISTS subjects_code_key;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_name_key;
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS questions_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.test_results ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.test_codes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.test_answers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.terms ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.teacher_assignments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.subjects ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sessions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.questions ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.test_results_id_seq;
DROP TABLE IF EXISTS public.test_results;
DROP SEQUENCE IF EXISTS public.test_codes_id_seq;
DROP TABLE IF EXISTS public.test_codes;
DROP SEQUENCE IF EXISTS public.test_answers_id_seq;
DROP TABLE IF EXISTS public.test_answers;
DROP SEQUENCE IF EXISTS public.terms_id_seq;
DROP TABLE IF EXISTS public.terms;
DROP SEQUENCE IF EXISTS public.teacher_assignments_id_seq;
DROP TABLE IF EXISTS public.teacher_assignments;
DROP SEQUENCE IF EXISTS public.subjects_id_seq;
DROP TABLE IF EXISTS public.subjects;
DROP SEQUENCE IF EXISTS public.sessions_id_seq;
DROP TABLE IF EXISTS public.sessions;
DROP SEQUENCE IF EXISTS public.questions_id_seq;
DROP TABLE IF EXISTS public.questions;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questions (
    id integer NOT NULL,
    question_text text NOT NULL,
    option_a text NOT NULL,
    option_b text NOT NULL,
    option_c text,
    option_d text,
    correct_answer character(1) NOT NULL,
    subject_id integer NOT NULL,
    class_level character varying(10) NOT NULL,
    term_id integer NOT NULL,
    session_id integer NOT NULL,
    teacher_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    question_type character varying(20) DEFAULT 'multiple_choice'::character varying NOT NULL,
    CONSTRAINT questions_correct_answer_check CHECK ((correct_answer = ANY (ARRAY['A'::bpchar, 'B'::bpchar, 'C'::bpchar, 'D'::bpchar])))
);


--
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    name character varying(20) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_current boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subjects (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(10) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subjects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subjects_id_seq OWNED BY public.subjects.id;


--
-- Name: teacher_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_assignments (
    id integer NOT NULL,
    teacher_id integer NOT NULL,
    subject_id integer NOT NULL,
    class_level character varying(10) NOT NULL,
    term_id integer NOT NULL,
    session_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: teacher_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.teacher_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: teacher_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.teacher_assignments_id_seq OWNED BY public.teacher_assignments.id;


--
-- Name: terms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.terms (
    id integer NOT NULL,
    name character varying(20) NOT NULL,
    display_order integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: terms_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.terms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: terms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.terms_id_seq OWNED BY public.terms.id;


--
-- Name: test_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_answers (
    id integer NOT NULL,
    result_id integer NOT NULL,
    question_id integer NOT NULL,
    selected_answer character(1),
    is_correct boolean NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT test_answers_selected_answer_check CHECK ((selected_answer = ANY (ARRAY['A'::bpchar, 'B'::bpchar, 'C'::bpchar, 'D'::bpchar])))
);


--
-- Name: test_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.test_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: test_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.test_answers_id_seq OWNED BY public.test_answers.id;


--
-- Name: test_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_codes (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    subject_id integer NOT NULL,
    class_level character varying(10) NOT NULL,
    term_id integer NOT NULL,
    session_id integer NOT NULL,
    duration_minutes integer NOT NULL,
    total_questions integer NOT NULL,
    pass_score integer DEFAULT 50,
    is_active boolean DEFAULT false,
    is_activated boolean DEFAULT false,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone,
    activated_at timestamp without time zone,
    batch_id character varying(255),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    test_type character varying(20) DEFAULT 'test'::character varying
);


--
-- Name: test_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.test_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: test_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.test_codes_id_seq OWNED BY public.test_codes.id;


--
-- Name: test_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_results (
    id integer NOT NULL,
    test_code_id integer NOT NULL,
    student_id integer NOT NULL,
    score integer NOT NULL,
    total_questions integer NOT NULL,
    time_taken integer NOT NULL,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: test_results_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.test_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: test_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.test_results_id_seq OWNED BY public.test_results.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50),
    email character varying(100),
    reg_number character varying(20),
    password character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    full_name character varying(100) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp without time zone,
    current_term character varying(20) DEFAULT 'First'::character varying,
    current_session character varying(20) DEFAULT '2024/2025'::character varying,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY (ARRAY[('admin'::character varying)::text, ('teacher'::character varying)::text, ('student'::character varying)::text])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: subjects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects ALTER COLUMN id SET DEFAULT nextval('public.subjects_id_seq'::regclass);


--
-- Name: teacher_assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_assignments ALTER COLUMN id SET DEFAULT nextval('public.teacher_assignments_id_seq'::regclass);


--
-- Name: terms id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.terms ALTER COLUMN id SET DEFAULT nextval('public.terms_id_seq'::regclass);


--
-- Name: test_answers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_answers ALTER COLUMN id SET DEFAULT nextval('public.test_answers_id_seq'::regclass);


--
-- Name: test_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_codes ALTER COLUMN id SET DEFAULT nextval('public.test_codes_id_seq'::regclass);


--
-- Name: test_results id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_results ALTER COLUMN id SET DEFAULT nextval('public.test_results_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_name_key UNIQUE (name);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_code_key UNIQUE (code);


--
-- Name: subjects subjects_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_name_key UNIQUE (name);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: teacher_assignments teacher_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_assignments
    ADD CONSTRAINT teacher_assignments_pkey PRIMARY KEY (id);


--
-- Name: terms terms_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.terms
    ADD CONSTRAINT terms_name_key UNIQUE (name);


--
-- Name: terms terms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.terms
    ADD CONSTRAINT terms_pkey PRIMARY KEY (id);


--
-- Name: test_answers test_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_answers
    ADD CONSTRAINT test_answers_pkey PRIMARY KEY (id);


--
-- Name: test_codes test_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_codes
    ADD CONSTRAINT test_codes_code_key UNIQUE (code);


--
-- Name: test_codes test_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_codes
    ADD CONSTRAINT test_codes_pkey PRIMARY KEY (id);


--
-- Name: test_results test_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_reg_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_reg_number_key UNIQUE (reg_number);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_questions_subject_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_subject_class ON public.questions USING btree (subject_id, class_level);


--
-- Name: idx_questions_teacher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_teacher ON public.questions USING btree (teacher_id);


--
-- Name: idx_teacher_assignments_teacher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teacher_assignments_teacher ON public.teacher_assignments USING btree (teacher_id);


--
-- Name: idx_test_codes_subject_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_codes_subject_class ON public.test_codes USING btree (subject_id, class_level);


--
-- Name: idx_test_results_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_results_student ON public.test_results USING btree (student_id);


--
-- Name: idx_test_results_test_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_results_test_code ON public.test_results USING btree (test_code_id);


--
-- Name: idx_users_reg_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_reg_number ON public.users USING btree (reg_number);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: questions questions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: questions questions_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: questions questions_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: questions questions_term_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.terms(id) ON DELETE CASCADE;


--
-- Name: teacher_assignments teacher_assignments_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_assignments
    ADD CONSTRAINT teacher_assignments_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: teacher_assignments teacher_assignments_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_assignments
    ADD CONSTRAINT teacher_assignments_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: teacher_assignments teacher_assignments_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_assignments
    ADD CONSTRAINT teacher_assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: teacher_assignments teacher_assignments_term_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_assignments
    ADD CONSTRAINT teacher_assignments_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.terms(id) ON DELETE CASCADE;


--
-- Name: test_answers test_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_answers
    ADD CONSTRAINT test_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: test_answers test_answers_result_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_answers
    ADD CONSTRAINT test_answers_result_id_fkey FOREIGN KEY (result_id) REFERENCES public.test_results(id) ON DELETE CASCADE;


--
-- Name: test_codes test_codes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_codes
    ADD CONSTRAINT test_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: test_codes test_codes_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_codes
    ADD CONSTRAINT test_codes_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: test_codes test_codes_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_codes
    ADD CONSTRAINT test_codes_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: test_codes test_codes_term_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_codes
    ADD CONSTRAINT test_codes_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.terms(id) ON DELETE CASCADE;


--
-- Name: test_results test_results_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: test_results test_results_test_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_test_code_id_fkey FOREIGN KEY (test_code_id) REFERENCES public.test_codes(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--
