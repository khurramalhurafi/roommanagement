--
-- PostgreSQL database dump
--

\restrict xcWQvUcuETEblqMWgq5sg2u0u2kEFl2wAdVq8Wz9j3HZXhFejSc6e0jzeGJ1AhW

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    employee_id_no text NOT NULL,
    name text NOT NULL,
    iqama text NOT NULL,
    mobile text NOT NULL,
    department text NOT NULL,
    company text NOT NULL,
    profile_image text,
    status text DEFAULT 'active'::text NOT NULL,
    room_id integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: export_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.export_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    export_type text NOT NULL,
    format text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: export_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.export_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: export_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.export_logs_id_seq OWNED BY public.export_logs.id;


--
-- Name: porta_cabins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.porta_cabins (
    id integer NOT NULL,
    name text NOT NULL,
    location text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: porta_cabins_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.porta_cabins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: porta_cabins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.porta_cabins_id_seq OWNED BY public.porta_cabins.id;


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rooms (
    id integer NOT NULL,
    room_number text NOT NULL,
    building text,
    floor text,
    capacity integer DEFAULT 4 NOT NULL,
    status text DEFAULT 'available'::text NOT NULL,
    qr_hash text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    porta_cabin_id integer
);


--
-- Name: rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rooms_id_seq OWNED BY public.rooms.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: transfer_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transfer_logs (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    from_room_id integer,
    to_room_id integer,
    transferred_at timestamp without time zone DEFAULT now(),
    transferred_by integer
);


--
-- Name: transfer_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transfer_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transfer_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transfer_logs_id_seq OWNED BY public.transfer_logs.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'hr'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
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
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: export_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.export_logs ALTER COLUMN id SET DEFAULT nextval('public.export_logs_id_seq'::regclass);


--
-- Name: porta_cabins id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.porta_cabins ALTER COLUMN id SET DEFAULT nextval('public.porta_cabins_id_seq'::regclass);


--
-- Name: rooms id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms ALTER COLUMN id SET DEFAULT nextval('public.rooms_id_seq'::regclass);


--
-- Name: transfer_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_logs ALTER COLUMN id SET DEFAULT nextval('public.transfer_logs_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id, created_at) FROM stdin;
1	21537	MR. HASHMAT ALI	2358793343	0531279183	WOOD -Paint	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
2	21540	MR. ROBELITO MUNDOC	2358797484	0577162626	WOOD -Paint	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
3	21548	MR. AHAMED RAZA	2361010792	0538204699	WOOD -Paint	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
4	21563	MR.  MONIRUL ISLAM	2481114045	0577134645	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
5	21545	MR. MUSTAFA AHMED	2438358638	0509375462	WOOD -Paint	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
6	21566	MR. TAHER MAHMOOD	2472788229	0550070619	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
7	21575	MR. ANWAR AHMED	2481113914	0596013357	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
8	21579	MR. MOMINUR RAHMAN	2474888472	572441481	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
9	21509	MR. NASIR AHMED	2292707136	0594585756	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
10	21580	MR. NASSER SAUM AB SAAB	2487266880	0561928331	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
11	21583	MR. SULAIMAN BHATTI	2427183583	0536521018	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
12	21587	MR. SHAFEEQ--ABDULRAHMAN	2060515331	0508399024	WOOD -Driver	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
13	21543	MR.ADIL ABDULLATIF-MOHAMMAD NADIM	2009602760	0577908970	WOOD -Driver	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
14	21544	MR.KALEAL ABDOURHMAN ASHRFOUZMAN	2221326784	0506580421	WOOD -Driver	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
15	21594	MR. GHULAM MOHD	2380267993	0545436470	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
16	21638	MR. H M ZAKARIA	2520088317	0576882314 - 0572382028	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
17	21527	MR. TAMER AL KAREF	2347189090	0537636582	WOOD -Paint	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
18	21605	MR. AJIJUL HAQUE	2504213576	0593046925	WOOD - Office Worker	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
19	21568	MR. MOAMAR ABDALLA ELGACK	2404404093	0595750701	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
20	21572	MR. DELWAR HOSSAIN ( MALEK )	2472546916	0594406872	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
21	21574	MR. ABDUR RAHMAN - A. HAI	2481023709	0572267109	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
22	21645	MR. AL AMIN JABER HOSSAIN	2578665701	0591799212 - 0501344587	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
23	21642	MR. RIYED HOSSEN NOYON MD	2515733828	0572443693 - 0571368945	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
24	21641	MR. AMEER KALEAL ABDOURHMAN ASHRFOUZMAN	2304068949	0578638378	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
25	21637	MR. SHAHIN MIA	2521159521	0576674263 - 0571649849	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:38.526011
26	21631	MR. SHOHEIL MIAH	2515569347	0573182252 - 0537497600	WOOD - Paint	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
27	21628	MR. MD BILLAL HOSSAIN	2521050084	0571290547 - 0558435260	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
28	21625	MR. ABDUL SABOOR	2119992507	0532510853	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
29	21611	MR. JIHAD RAYDAN ABDEL KHALEQ	2579056405	0594626389	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
30	21609	MR. KHANCHAN MIA	2513778064	0573072918	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
31	21607	MR. SOMON MIA JOYNAL	2504560695	0552542139	WOOD - Paint	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
32	21604	MR. MD ABU RAYHAN	2504560604	0537629312	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
33	21584	MR. DABIR KHAN RUPAI KHAN	2491375123	0570307740	WOOD - Paint	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
34	21581	MR. MOHAMMED ARIF FAZAL KARIM	2336837592	0536521158	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
35	21553	MR. RIDOY MOTALEB	2475907156	0576638140	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
36	21552	MR. JAMAL M. BAKRI	2346057256	0544795615	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
37	21551	MR. ABDUL NABI	2326426232	0552087745	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
38	21519	MR. SAYED SAMIR	2398352613	0536674425	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
39	21542	MR. NAGANDAR	2311030601	0504202637	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
40	21528	MR. ZUBAIR KHAN	2358793764	0551127060	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
41	21523	MR. AMEER AHMED	2358793426	0531279427	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
42	21516	MR. MD SIRAZUL ISLAM	2481024228	0596489160	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
43	21504	MR. MOHD. TAHER	2128175045	0572003413	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
44	21503	MR. MOHD. ARSHAD	2044178727	0551493462	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
45	21636	MR. AHMED MOHAMED MOSTAFA SALEH	2538142759	0578444130	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
46	21627	MR. HAMADI MOHAMMED AL-SALAIMI	2513673828	0571747059	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
47	21529	MR. MUNIR TAWWATI	2145606113	0571542975	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
48	21577	MR. SALIM MUNIR	2339701019	0572884362	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
49	21663	MR. MUHAMMAD SULTAN ATTA MUHAMMAD	2539681482	0553509433	WOOD - Electrician	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
50	21727	MR. MUZAMMIL BASHIR BASHIR AHMED	2582920431	0530323160	WOOD - CNC	AL-HURAFI	\N	active	\N	2026-03-08 23:30:42.293243
51	21531	MR. MOHD. RIZWAN	2358794101	0572834754	WOOD -Paint	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
52	21561	MR. FRANCISCO JECIEL	2427183831	0506749509	WOOD - Paint	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
53	21570	MR. RUBEL OLI UDDIN	2481114177	577039525	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
54	21017	MR. WASEEM KHAN	2401126608	0596162072	WOOD - Warehouse Keeper	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
55	21724	MR. MD SALAM AKANDO	2578470995	0535483385	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
56	21747	MR. MUTAHIR ARIF MUHAMMAD ARIF	2624348500	0530747912	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
57	21744	MR. MUHAMMAD AKHTAR GHULAM HAIDER	2429571462	548603381	WOOD - Paint	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
58	21743	MR. MUHAMMAD MAJID KHAN ABDUL GHAFFAR	2348943719	599214608	WOOD - Paint	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
59	21741	MR. RICKY CANDIDATO BELTRAN	2612215992	0539892815	WOOD - Paint	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
60	21739	MR. EMAMUL NURUKHAN	2602098234	0547190987	WOOD - Cleaner	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
61	21735	MR. ABDUL NAIF SAHIBOL - ARIP	2593364835	0533128063 - 0560515883	WOOD - Office Worker	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
62	21734	MR. MUHAMMAD ZOHAIB MUHAMMAD RIAZ	2594984151	0503857544	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
63	21733	MR. MUHAMMAD FAYYAZ REHMAT ALI	2594984078	0503859299	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
64	21732	MR. ALI HUSSNAIN MAQSOOD AHMED	2582718090	0574927946	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
65	21730	MR. NAIIM ABDULLAH	2557097553	0530535100	WOOD - Office Worker	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
66	21726	MR. IRFAN UDDIN	2580022644	0571374348 - 0571478400	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
67	21722	MR. SHAH ALAM ISTEYAQ AHMAD	2544455336	0531078434	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
68	21721	MR. SHAHADAD HOSSAIN	2521517215	0551346739	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
69	21719	MR. MD SHAHID ISLAM	2568645440	0526864544 - 0531956075	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
70	21718	MR. MD MAMUN KHAN	2575325432	0569631818	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
71	21717	MR. JOVITO LISING ALCANTARA	2577596832	0550700945 - 0570514285	WOOD - Paint	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
72	21715	MR. MUHAMMAD BILAL ABDUL SATTAR	2522961370	0582680338	WOOD - Paint	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
73	21703	MR. FLORANTE GRANETA - PINEDA	2278381997	0507686960	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
74	21702	MR. TANJIL HOSSAIN	2570675757	0556683181	WOOD - Electrician	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
75	21700	MR. MOHAMMAD JAVED	2554461356	0555410791	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:45.981256
76	21697	MR. ADBULLAH ABUL HOSSAIN	2565631591	0571563217 - 0551242503	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:49.769099
77	21696	MR. BELAL AHMED	2559290883	0534725813	WOOD - CNC	AL-HURAFI	\N	active	\N	2026-03-08 23:30:49.769099
78	21690	MR. BALAWAL BASHIR BASHIR AHMAD	2560039618	0539655868	WOOD - CNC	AL-HURAFI	\N	active	\N	2026-03-08 23:30:49.769099
79	21689	MR. JOHNSON ECHAVE DE VERA	2560533271	0577309208	WOOD - Office Worker	AL-HURAFI	\N	active	\N	2026-03-08 23:30:49.769099
80	21687	MR. MAHADIL TAN SAHIDUL	2539600755	0535257242	WOOD - Office Worker	AL-HURAFI	\N	active	\N	2026-03-08 23:30:49.769099
81	21686	MR. MUSTAPHA CHEBIB	2547810271	0547585643	WOOD - Paint	AL-HURAFI	\N	active	\N	2026-03-08 23:30:49.769099
82	21646	MR. MOHAMMAD SAFIQUL ISLAM	2521957999	0572951978 - 0572254657	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:49.769099
83	21639	MR. MUHAMMAD FURQAN MUHAMMAD AMIN	2525931156	0565829703	WOOD - Paint	AL-HURAFI	\N	active	\N	2026-03-08 23:30:49.769099
84	21629	MR. MD SIRAJ BISWAS	2516251747	0572713162 - 0536150903	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:49.769099
85	21610	MR. SAMI HASSAN HASSAN HEJRES	2309040554	0509139053	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:49.769099
86	21588	MR. SAGOR MEAH	2481025415	0567595691	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:49.769099
87	21554	MR. AMER A. DAEEM	2368263220	537394858	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:49.769099
88	21547	MR. NISAR BATCHA	2358794150	0572346952	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:49.769099
89	21530	MR. REZAUL MONDOL	2472357405	0533933703	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:49.769099
90	21515	MR. ANWARUL ISLAM	2481025142	0567561951	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:49.769099
91	21559	MR. ABDU MOHD. YUNUS	2414046439	566076463	WOOD - Paint	AL-HURAFI	\N	active	\N	2026-03-08 23:30:49.769099
92	21740	MR. MOHAMMED IRFAN	2294728890	0568173106	WOOD - Paint	AL-HURAFI	\N	active	\N	2026-03-08 23:30:49.769099
93	21712	MR. ABDULHADI - - DRZAR	2170753459	0537086870	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:49.769099
94	21648	MR. ATIK ALI JAKIR ALI	2518776576	0571102196 - 0545213903	WOOD -Paint	AL-HURAFI	\N	active	\N	2026-03-08 23:30:49.769099
95	21601	MR. ADEL GHAZAL SALEEM	2579056462	0595365160	WOOD	AL-HURAFI	\N	active	\N	2026-03-08 23:30:49.769099
\.


--
-- Data for Name: export_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.export_logs (id, user_id, export_type, format, created_at) FROM stdin;
\.


--
-- Data for Name: porta_cabins; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.porta_cabins (id, name, location, status, created_at) FROM stdin;
1	Cabin A	Camp A Zone	active	2026-03-08 23:29:55.095826
2	Cabin B	Camp B Zone	active	2026-03-08 23:29:55.095826
3	Cabin C	Camp C Zone	active	2026-03-08 23:29:55.095826
4	Cabin D	Camp D Zone	active	2026-03-08 23:29:55.095826
5	Cabin E	Camp E Zone	active	2026-03-08 23:29:55.095826
6	Cabin F	Camp F Zone	active	2026-03-08 23:29:55.095826
7	Cabin G	Camp G Zone	active	2026-03-08 23:29:55.095826
8	Cabin H	Camp H Zone	active	2026-03-08 23:29:55.095826
9	Cabin I	Camp I Zone	active	2026-03-08 23:29:55.095826
10	Cabin J	Camp J Zone	active	2026-03-08 23:29:55.095826
11	Cabin K	Camp K Zone	active	2026-03-08 23:29:55.095826
12	Cabin L	Camp L Zone	active	2026-03-08 23:29:55.095826
13	Cabin M	Camp M Zone	active	2026-03-08 23:29:55.095826
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rooms (id, room_number, building, floor, capacity, status, qr_hash, created_at, porta_cabin_id) FROM stdin;
1	F-5	Barracks F-5	ROOM 5	2	available	1dcc17e5e2c1cf16776a0f41a6292652	2026-03-08 23:30:08.231564	6
2	G-1	Barracks G-1	ROOM 2	2	available	81143ce566e296fd32679ab8cfa4d410	2026-03-08 23:30:08.231564	7
3	G-2	Barracks G-2	ROOM 2	2	available	dbe56ee5e2a85dcc971c0c3e1c441517	2026-03-08 23:30:08.231564	7
4	G-3	Barracks G-3	ROOM 3	2	available	f624c8f14f333c79838c4ef91708d2c3	2026-03-08 23:30:08.231564	7
5	G-4	Barracks G-4	ROOM 4	2	available	09fe1a301f80e87088e4cba0d495dadb	2026-03-08 23:30:08.231564	7
6	H-1	Barracks H-1	ROOM 1	1	available	5f51ae24464f6496897b1fce6b3c7f23	2026-03-08 23:30:08.231564	8
7	H-2	Barracks H-2	ROOM 2	2	available	bc4ce3f5afd146a274c25ecd2651b4c5	2026-03-08 23:30:08.231564	8
8	H-3	Barracks H-3	ROOM 2	2	available	45c0bc02863c6603004991478c371076	2026-03-08 23:30:08.231564	8
9	H-4	Barracks H-4	ROOM 2	2	available	72d8e01b3f29bc81c37ee33a62df01f4	2026-03-08 23:30:08.231564	8
10	I-2	Barracks i-2	ROOM 2	2	available	e92aa46f48c54d55a56e114765caa902	2026-03-08 23:30:08.231564	9
11	I-3	Barracks i-3	ROOM 2	2	available	8f1c239061add3cad9fe0a7fc7003f5c	2026-03-08 23:30:08.231564	9
12	I-4	Barracks i-4	ROOM 2	2	available	921b4524501c87090be4605ac238132e	2026-03-08 23:30:08.231564	9
13	J-1	Barracks J-1	ROOM 3	3	available	9bce1f255c198429e159fcc02cb521cf	2026-03-08 23:30:08.231564	10
14	J-2	Barracks J-2	ROOM 3	3	available	20ebbe21d94fa4d0479484b58ce581d4	2026-03-08 23:30:08.231564	10
15	J-3	Barracks J-3	ROOM 2	2	available	6b45ee3908c2f4a7e7a0e784616957f4	2026-03-08 23:30:08.231564	10
16	J-5	Barracks J-5	ROOM 2	2	available	b5d5dc11c070eb928cd567c035cadc68	2026-03-08 23:30:08.231564	10
17	J-4	Barracks J-4	ROOM 2	2	available	417768ccd03f2962c0057f7587cebac1	2026-03-08 23:30:08.231564	10
18	K-1	Barracks K-1	ROOM 3	3	available	e7fdab5de7843f63112e9537559fc84e	2026-03-08 23:30:08.231564	11
19	K-2	Barracks K-2	ROOM 2	3	available	ac49d622156f549671ef3a2e193a4d5c	2026-03-08 23:30:08.231564	11
20	A-1	Barracks  A -1	Room  1	1	available	c6976a822f5794198ba94e0f192e04b3	2026-03-08 23:30:08.231564	1
21	A-2	Building A -2	Room 2	2	available	cc464ca3a4a8ecfa3cb72ae52d74e2f5	2026-03-08 23:30:08.231564	1
22	B-1	Building B -1	Room 2	2	available	96334cbbbcd73a44b08f90c839046b5b	2026-03-08 23:30:08.231564	2
23	B-2	Barracks B-2	Room 2	2	available	30258c0ec8e88d0587589640accb4ac5	2026-03-08 23:30:08.231564	2
24	B-3	Barracks B-3	Room 1	2	available	101e95e23e5519f8d908f205acf6b9e1	2026-03-08 23:30:08.231564	2
25	B-4	Barracks B-4	Room 3	3	available	0361f431d0e3c6f39cfc8e7791434420	2026-03-08 23:30:08.231564	2
26	B-5	Barracks B-5	Room 2	2	available	b97a7f11b915d2e45186b786616f4b04	2026-03-08 23:30:08.231564	2
27	C-1	Barracks C-1	Room 1	1	available	d6d81a4c97fc664a5459d62d1111faa8	2026-03-08 23:30:08.231564	3
28	K-3	Barracks K-3	ROOM 3	3	available	31981d4b4d44b4f2a078cd3129c4dd29	2026-03-08 23:30:08.231564	11
29	K-4	Barracks K-4	ROOM 3	3	available	d6aa07bc5dd609138d7240c1791618b6	2026-03-08 23:30:08.231564	11
30	D-1	Barracks D-1	Room 2	2	available	46488b7267c1811e4a517e3efb7630e4	2026-03-08 23:30:08.231564	4
31	D-2	Barracks D-2	Room 2	2	available	98bd3e478a382b5551dfb8fdeeb27928	2026-03-08 23:30:08.231564	4
32	D-3	Barracks D-3	Room 2	2	available	644947f528ace6c97de2d0f96dea313c	2026-03-08 23:30:08.231564	4
33	D-4	Barracks D-4	Room 2	2	available	cd3713d20e7af878b4e2e964ce36d087	2026-03-08 23:30:08.231564	4
34	D-5	Barracks D-5	Room 2	3	available	2ca0e416b253f698ba28403361a4633e	2026-03-08 23:30:08.231564	4
35	E-4	Barracks E-4	ROOM 2	3	available	e8e84a56c2625e9a216236c4cf78cc4b	2026-03-08 23:30:08.231564	5
36	E-5	Barracks E-5	ROOM 2	2	available	db4ad130846b6af9d115f88f3c6676c9	2026-03-08 23:30:08.231564	5
37	F-1	Barracks F-1	ROOM 2	2	available	2aee986095d1a16a114929496bef2c33	2026-03-08 23:30:08.231564	6
38	F-2	Barracks F-2	ROOM 2	2	available	c461fa8a59757b8740cc54dd3301dfbb	2026-03-08 23:30:08.231564	6
39	F-4	Barracks F-4	ROOM 2	2	available	f8165055c2fd06a173218d69a5bb33fd	2026-03-08 23:30:08.231564	6
40	L-1	Barracks L-1	ROOM 2	2	available	58393e68f1a776590a81ce353aed4ea3	2026-03-08 23:30:08.231564	12
41	L-2	Barracks L-2	ROOM 2	2	available	45248241c30251a9272c64a7c8bfc610	2026-03-08 23:30:08.231564	12
42	L-3	Barracks L-3	ROOM 3	3	available	c2bd94c6ec079dae6f5a9404c7c23468	2026-03-08 23:30:08.231564	12
43	L-4	Barracks L-4	ROOM 2	2	available	72618b5cb4bb8ee587b179779d8e3ad7	2026-03-08 23:30:08.231564	12
44	M-1	Barracks M-1	ROOM 3	3	available	61c7a19c828458844d9fdaa6dd94f080	2026-03-08 23:30:08.231564	13
45	M-2	Barracks M-2	ROOM 2	2	available	e331be5a819897a0c143c67409f8e2ba	2026-03-08 23:30:08.231564	13
46	K-5	Barracks K-5	ROOM 5	5	available	cfe41e7d2a7e73930759ea281b5e1212	2026-03-08 23:30:08.231564	11
47	I-1	Barracks i-1	ROOM 2	2	available	dd2e4f2739aee7a084862329221723df	2026-03-08 23:30:08.231564	9
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session (sid, sess, expire) FROM stdin;
U6tD8d3k7np0vvhqFqVceK-2lQehZaGU	{"cookie":{"originalMaxAge":86400000,"expires":"2026-03-09T22:14:11.815Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":1}	2026-03-10 18:38:45
\.


--
-- Data for Name: transfer_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transfer_logs (id, employee_id, from_room_id, to_room_id, transferred_at, transferred_by) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password, role, status, created_at) FROM stdin;
1	System Administrator	admin@company.com	$2b$10$3fpe9HEQ4YAOzv8bS2gXuuboAmlQOSJi8515Z1HqiBXhDDbGqeIVG	admin	active	2026-03-08 22:12:00.262548
2	Sarah Johnson	sarah.hr@company.com	$2b$10$ABmn7R195ea.fxu2Bl4WAuHchrCA07pfe1tn93bJqzNphO.Zv.U56	hr	active	2026-03-08 22:12:00.269938
\.


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employees_id_seq', 95, true);


--
-- Name: export_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.export_logs_id_seq', 1, false);


--
-- Name: porta_cabins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.porta_cabins_id_seq', 13, true);


--
-- Name: rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rooms_id_seq', 47, true);


--
-- Name: transfer_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transfer_logs_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: employees employees_employee_id_no_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_id_no_unique UNIQUE (employee_id_no);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: export_logs export_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.export_logs
    ADD CONSTRAINT export_logs_pkey PRIMARY KEY (id);


--
-- Name: porta_cabins porta_cabins_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.porta_cabins
    ADD CONSTRAINT porta_cabins_name_key UNIQUE (name);


--
-- Name: porta_cabins porta_cabins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.porta_cabins
    ADD CONSTRAINT porta_cabins_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_qr_hash_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_qr_hash_unique UNIQUE (qr_hash);


--
-- Name: rooms rooms_room_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_room_number_unique UNIQUE (room_number);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: transfer_logs transfer_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_logs
    ADD CONSTRAINT transfer_logs_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: employees employees_room_id_rooms_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_room_id_rooms_id_fk FOREIGN KEY (room_id) REFERENCES public.rooms(id);


--
-- Name: export_logs export_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.export_logs
    ADD CONSTRAINT export_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: rooms rooms_porta_cabin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_porta_cabin_id_fkey FOREIGN KEY (porta_cabin_id) REFERENCES public.porta_cabins(id);


--
-- Name: transfer_logs transfer_logs_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_logs
    ADD CONSTRAINT transfer_logs_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: transfer_logs transfer_logs_from_room_id_rooms_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_logs
    ADD CONSTRAINT transfer_logs_from_room_id_rooms_id_fk FOREIGN KEY (from_room_id) REFERENCES public.rooms(id);


--
-- Name: transfer_logs transfer_logs_to_room_id_rooms_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_logs
    ADD CONSTRAINT transfer_logs_to_room_id_rooms_id_fk FOREIGN KEY (to_room_id) REFERENCES public.rooms(id);


--
-- Name: transfer_logs transfer_logs_transferred_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_logs
    ADD CONSTRAINT transfer_logs_transferred_by_users_id_fk FOREIGN KEY (transferred_by) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict xcWQvUcuETEblqMWgq5sg2u0u2kEFl2wAdVq8Wz9j3HZXhFejSc6e0jzeGJ1AhW

