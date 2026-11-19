#!/usr/bin/env python3
"""
Generate a professional, high-density, ATS-optimized 1-page PDF Resume for Samarth Nimangre.
Built using ReportLab with exact point-budgeting to ensure it fits precisely on one page.
"""

import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

def generate_resume(output_pdf_path="Samarth_Nimangre_Resume.pdf"):
    # Target: 1 Page Letter (612 x 792 pt)
    # Margins: Left/Right 32pt, Top/Bottom 28pt -> Usable: 548pt wide x 736pt high
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        leftMargin=32,
        rightMargin=32,
        topMargin=26,
        bottomMargin=26,
    )

    styles = getSampleStyleSheet()

    # Color Palette: Clean Executive Slate & Obsidian Tech
    COLOR_PRIMARY = colors.HexColor("#0f172a")    # Slate 900
    COLOR_ACCENT = colors.HexColor("#0369a1")     # Blue 700 / Brand
    COLOR_BODY = colors.HexColor("#334155")       # Slate 700
    COLOR_MUTED = colors.HexColor("#64748b")      # Slate 500
    COLOR_LINE = colors.HexColor("#cbd5e1")       # Slate 300

    # Custom Typography Styles
    style_name = ParagraphStyle(
        "HeaderName",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=19,
        leading=21,
        textColor=COLOR_PRIMARY,
        alignment=TA_CENTER,
    )

    style_title = ParagraphStyle(
        "HeaderTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=12,
        textColor=COLOR_ACCENT,
        alignment=TA_CENTER,
        spaceAfter=3,
    )

    style_contact = ParagraphStyle(
        "HeaderContact",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.2,
        leading=10.5,
        textColor=COLOR_MUTED,
        alignment=TA_CENTER,
    )

    style_section_h1 = ParagraphStyle(
        "SectionH1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=12,
        textColor=COLOR_PRIMARY,
        spaceBefore=5,
        spaceAfter=2,
    )

    style_summary = ParagraphStyle(
        "SummaryText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.2,
        leading=10.8,
        textColor=COLOR_BODY,
    )

    style_skills_cat = ParagraphStyle(
        "SkillCategory",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.2,
        leading=10.8,
        textColor=COLOR_PRIMARY,
    )

    style_skills_val = ParagraphStyle(
        "SkillValue",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.2,
        leading=10.8,
        textColor=COLOR_BODY,
    )

    style_project_title = ParagraphStyle(
        "ProjectTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.0,
        leading=11.2,
        textColor=COLOR_PRIMARY,
    )

    style_project_meta = ParagraphStyle(
        "ProjectMeta",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.8,
        leading=10.5,
        textColor=COLOR_ACCENT,
        alignment=TA_RIGHT,
    )

    style_bullet = ParagraphStyle(
        "ProjectBullet",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.0,
        leading=10.4,
        textColor=COLOR_BODY,
        leftIndent=9,
        firstLineIndent=-9,
        spaceAfter=1.5,
    )

    style_edu_left = ParagraphStyle(
        "EduLeft",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.2,
        leading=10.5,
        textColor=COLOR_PRIMARY,
    )

    style_edu_right = ParagraphStyle(
        "EduRight",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.0,
        leading=10.5,
        textColor=COLOR_MUTED,
        alignment=TA_RIGHT,
    )

    story = []

    # 1. HEADER SECTION
    story.append(Paragraph("SAMARTH NIMANGRE", style_name))
    story.append(Paragraph("AI SYSTEMS & BACKEND INFRASTRUCTURE ENGINEER", style_title))
    contact_line = (
        'Karnataka, India &nbsp;|&nbsp; '
        '<a href="mailto:samarthknimangre@gmail.com"><font color="#0369a1">samarthknimangre@gmail.com</font></a> &nbsp;|&nbsp; '
        '+91 6361209256 &nbsp;|&nbsp; '
        '<a href="https://sam-codes.vercel.app"><font color="#0369a1">sam-codes.vercel.app</font></a>'
    )
    story.append(Paragraph(contact_line, style_contact))
    
    links_line = (
        '<a href="https://github.com/Sam-CodesAI"><font color="#0369a1"><b>GitHub:</b> github.com/Sam-CodesAI</font></a> &nbsp;•&nbsp; '
        '<a href="https://linkedin.com/in/sam-codesai"><font color="#0369a1"><b>LinkedIn:</b> sam-codesai</font></a> &nbsp;•&nbsp; '
        '<a href="https://t.me/Samarth1306"><font color="#0369a1"><b>Telegram:</b> @Samarth1306</font></a> &nbsp;•&nbsp; '
        '<a href="https://pypi.org/project/sutradb/"><font color="#0369a1"><b>PyPI:</b> sutradb</font></a>'
    )
    story.append(Paragraph(links_line, style_contact))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=0.75, color=COLOR_LINE, spaceAfter=4))

    # 2. PROFESSIONAL SUMMARY
    story.append(Paragraph("PROFESSIONAL SUMMARY", style_section_h1))
    summary_text = (
        "High-autonomy Systems & AI Engineer with expertise in low-level database internals, real-time edge streaming "
        "pipelines, and resilient distributed agentic architectures. Author of <b>SutraDB</b> (PyPI v2.2.1), a zero-dependency "
        "SIMD-accelerated hybrid vector database (<0.4ms P50 latency, 52k docs/s). Creator of <b>VaniEdge</b>, a sub-second edge "
        "voice telephony platform utilizing Cloudflare Worker WebSockets, 8kHz μ-law audio transcoding, and 4-tier failover circuit breakers. "
        "Experienced in Python (NumPy BLAS, Asyncio, SIMD), TypeScript (Next.js 16 Turbopack, React 19), and PostgreSQL (RLS)."
    )
    story.append(Paragraph(summary_text, style_summary))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_LINE, spaceAfter=4))

    # 3. CORE TECHNICAL COMPETENCIES
    story.append(Paragraph("CORE TECHNICAL COMPETENCIES", style_section_h1))
    skills_data = [
        [
            Paragraph("Systems & AI Core:", style_skills_cat),
            Paragraph("SIMD Vector Distance, BM25 Lexical Indexing, Reciprocal Rank Fusion (RRF), mmap Zero-Copy, CRC32 WAL, Audio DSP (8kHz μ-law PCM), LLM Cascading & Function Calling, Grounded RAG.", style_skills_val)
        ],
        [
            Paragraph("Infrastructure & Distributed:", style_skills_cat),
            Paragraph("Cloudflare Workers, Twilio TwiML / WebRTC, WebSockets, Supabase PostgreSQL (RLS, Migrations, Indexing), Docker, Redis/KV, Linux/Bash, Vercel Edge.", style_skills_val)
        ],
        [
            Paragraph("Languages & Frameworks:", style_skills_cat),
            Paragraph("Python 3.12+ (NumPy, Asyncio), TypeScript, Next.js 16 (App Router, Turbopack, Server Actions), React 19, Tailwind CSS v4, Node.js 22, SQL.", style_skills_val)
        ],
        [
            Paragraph("Reliability & Testing:", style_skills_cat),
            Paragraph("Test-Driven Development (TDD), Circuit Breakers, Exponential Backoff with Jitter, Cryptographic HMAC-SHA1/SHA256, Webhook Fast-Ack.", style_skills_val)
        ]
    ]
    t_skills = Table(skills_data, colWidths=[130, 418])
    t_skills.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0.8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0.8),
    ]))
    story.append(t_skills)
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_LINE, spaceAfter=4))

    # 4. FLAGSHIP PRODUCTION SYSTEMS & PROJECTS
    story.append(Paragraph("PRODUCTION SYSTEMS & FLAGSHIP PROJECTS", style_section_h1))

    # Project 1: SutraDB
    p1_header = [
        Paragraph('<b>SutraDB (सूत्र DB) — Hybrid Vector Search & BM25 Lexical Engine</b>', style_project_title),
        Paragraph('<a href="https://pypi.org/project/sutradb/"><font color="#0369a1"><b>PyPI: sutradb v2.2.1</b></font></a> &nbsp;|&nbsp; <a href="https://github.com/Sam-CodesAI/SutraDB"><font color="#0369a1"><b>GitHub</b></font></a>', style_project_meta)
    ]
    t_p1 = Table([p1_header], colWidths=[370, 178])
    t_p1.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
    ]))
    story.append(t_p1)
    story.append(Paragraph("• Built clean-room, zero-dependency hybrid vector database in Python & NumPy BLAS combining SIMD-accelerated linear algebra, Robertson-Spärck Jones BM25 lexical ranking, and dynamic in-flight compound metadata bitmasks.", style_bullet))
    story.append(Paragraph("• Pre-normalized unit vectors at insertion to reduce Cosine Similarity to pure hardware BLAS GEMV dot products, achieving <b>sub-0.4ms P50 latency</b> across 5,000 128-dim vectors.", style_bullet))
    story.append(Paragraph("• Designed 64-byte aligned <b>.sutra</b> binary container with zero-copy memory-mapped (<code>mmap</code>) reads and append-only CRC32 Write-Ahead Log (WAL), surviving cold restarts with zero corruption.", style_bullet))
    story.append(Paragraph("• Sustained <b>52,000+ docs/sec</b> ingestion throughput with ~22MB RAM footprint; published to PyPI and verified via 100% passing 20/20 pytest test suite.", style_bullet))
    story.append(Spacer(1, 2.5))

    # Project 2: VaniEdge Voice Platform
    p2_header = [
        Paragraph('<b>VaniEdge Voice Platform — Sub-Second Edge AI Voice Telephony & Failover</b>', style_project_title),
        Paragraph('<a href="https://vaniedge.vercel.app"><font color="#0369a1"><b>vaniedge.vercel.app</b></font></a> &nbsp;|&nbsp; <a href="https://github.com/Sam-CodesAI/VaniEdge-Voice-Platform"><font color="#0369a1"><b>GitHub</b></font></a>', style_project_meta)
    ]
    t_p2 = Table([p2_header], colWidths=[370, 178])
    t_p2.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
    ]))
    story.append(t_p2)
    story.append(Paragraph("• Architected sub-second edge voice telephony engine bridging Twilio PSTN carriers and browser WebRTC to AI LLMs via Cloudflare Worker WebSockets.", style_bullet))
    story.append(Paragraph("• Engineered bidirectional 8kHz μ-law PCM transcoding, sub-second TTFT/dead-air watchdogs, and zero-latency audio buffer flushing for seamless conversational barge-in.", style_bullet))
    story.append(Paragraph("• Designed 4-tier failover circuit breaker (Gemini matrix fallback &rarr; <b>&lt;10ms Voicemail Circuit Breaker</b> &rarr; Warm Transfer &rarr; Autonomous SMS Rescue) eliminating dropped calls.", style_bullet))
    story.append(Paragraph("• Deployed customer dashboard with scrypt session cookies, tenant IDOR isolation, and instant Telegram admin alerts; verified via <b>70/70 passing automated tests</b>.", style_bullet))
    story.append(Spacer(1, 2.5))

    # Project 3: Teleflow Agent
    p3_header = [
        Paragraph('<b>TeleFlow Agent — Autonomous Conversational Lead Qualification & CRM Router</b>', style_project_title),
        Paragraph('<a href="https://github.com/Sam-CodesAI/teleflow-agent"><font color="#0369a1"><b>GitHub: teleflow-agent</b></font></a>', style_project_meta)
    ]
    t_p3 = Table([p3_header], colWidths=[370, 178])
    t_p3.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
    ]))
    story.append(t_p3)
    story.append(Paragraph("• Built an autonomous multi-turn qualification agent on Next.js 16 edge webhooks achieving <b>sub-300ms turn latency</b> with zero external runtime dependencies.", style_bullet))
    story.append(Paragraph("• Integrated deterministic dual-database knowledge grounding (strict zero-knowledge truth) to eliminate LLM hallucinations on pricing and service scope.", style_bullet))
    story.append(Paragraph("• Automated dynamic Cal.com booking sync, real-time Telegram Bot admin alerts (@Samarth1306), and atomic Supabase PostgreSQL audit trail ingestion.", style_bullet))
    story.append(Spacer(1, 2.5))

    # Project 4: SAM CODES Command Center
    p4_header = [
        Paragraph('<b>SAM CODES — Personal Platform & Administrative Command Center</b>', style_project_title),
        Paragraph('<a href="https://sam-codes.vercel.app"><font color="#0369a1"><b>sam-codes.vercel.app</b></font></a>', style_project_meta)
    ]
    t_p4 = Table([p4_header], colWidths=[370, 178])
    t_p4.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
    ]))
    story.append(t_p4)
    story.append(Paragraph("• Full-stack Next.js 16 / React 19 administrative hub managing 14 Supabase PostgreSQL tables with zero-trust Row-Level Security (RLS) policies.", style_bullet))
    story.append(Paragraph("• Implemented edge Web Crypto HMAC-SHA256 session verification and sliding-window rate limiters; built automated SHA-256 database backup engine.", style_bullet))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_LINE, spaceAfter=4))

    # 5. EDUCATION & LOGISTICS
    story.append(Paragraph("EDUCATION & AVAILABILITY", style_section_h1))
    edu_data = [
        [
            Paragraph("<b>Pre-University / High School</b> &nbsp;|&nbsp; Science, Mathematics & Computer Science", style_edu_left),
            Paragraph("Karnataka, India &nbsp;|&nbsp; Graduating 2026", style_edu_right)
        ],
        [
            Paragraph("<b>Logistics & Work Authorization:</b> Open for high-impact AI Systems, Backend Infrastructure, or Founding Engineer roles & contract builds. Highly autonomous asynchronous execution.", style_skills_val),
            Paragraph("", style_edu_right)
        ]
    ]
    t_edu = Table(edu_data, colWidths=[380, 168])
    t_edu.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0.5),
        ('SPAN', (0, 1), (1, 1)),
    ]))
    story.append(t_edu)

    doc.build(story)
    print(f"Successfully generated {output_pdf_path}!")

if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else "Samarth_Nimangre_Resume.pdf"
    generate_resume(out_file)
