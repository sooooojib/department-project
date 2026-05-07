<div style="text-align: center; margin-top: 80px;">
  
# EduPortal
## Department Management Web Application
---
## Web Project Lab Assessment

<br><br>

**Submitted To:**
Aminul Sir
Instructor, Web Project Lab

<br>

**Submitted By:**
Name: [Write Your Name Here]
Student ID: [Write Your ID Here]
Submission Date: Next Wednesday

<br><br><br>

### Index Directory:
**Page 1:** Index / Front Cover Page
**Page 2:** Project Documentation & Global Layout Mapping
**Page 3:** Sub-Module Feature Diagrams & Specifications
**Page 4:** Instructor’s Feedback Space
**Page 5:** Instructor’s Feedback Space

</div>

<div style="page-break-after: always; break-after: page;"></div>

# 1. Project Description
**EduPortal** is a comprehensive, full-stack centralized hub designed to modernize university department operations. It bridges the gap between students, educators, and administrators by combining role-based dashboards, interactive automated scheduling, centralized attendance tracking, and direct counseling bookings into a single accessible interface. Its core purpose is to eradicate manual ledger management and fragmented internal communication channels, replacing them with a streamlined, database-driven educational lifecycle.

## 1.1 Technology Stack
| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React, Next.js, HTML, CSS | Polished UI, routing, and State Management |
| **Styling** | Tailwind CSS | Responsive, utility-first UI design |
| **Backend Framework** | Next.js API routes, TS | High-performance serverless Node.js endpoints |
| **Database ORM** | Prisma | Advanced type-safe database queries & schemas |
| **UI Components** | Lucide React | Efficient, scalable interface vector graphics |
| **Database & Auth** | PostgreSQL/SQL, bcrypt | Secured user data handling and encryption |

# 2. Web Page Block Diagrams & Feature Mapping

## 2.1 Unified Authentication Interface (Login & Signup)
```mermaid
flowchart LR
    subgraph Authentication_Page [Authentication Page UI]
        direction LR
        subgraph Aesthetics_Module [Left Panel]
            UI_Logo([Promotional Graphic])
            UI_Tagline([Mission Statement])
        end
        subgraph Identity_Control [Right Panel / Form]
            Input_Type[/Dropdown: Account Type/]
            Input_Name[/Input: Full Name/]
            Input_ID[/Input: Email or Student ID/]
            Input_Pass[/Input: Password/]
            BTN_Auth[[Button: Log In / Create Account]]
            Link_Mode([Nav Link: Toggle Login/Signup])
        end
    end
```

## 2.2 Core Role-Based Dashboard
```mermaid
flowchart TD
    subgraph Dashboard_Page [Dashboard Core UI]
        Nav_Links([Links: Home, Schedule, Counseling, Attendance, Feedback])
        BTN_Logout[[Button: Secure Logout]]
        
        subgraph Top_Metrics [Statistics Array]
            Stats_Class([Feature: Read-only Total Classes Dashboard])
            Stats_Exam([Feature: Read-only Upcoming Exams Counter])
        end
        
        subgraph Main_Feed [Dynamic Timeline Feed]
            Timeline([Feature: Chronological timeline of upcoming commitments])
            BTN_Action[[Button: Quick Access System Actions]]
        end
    end
```

<div style="page-break-after: always; break-after: page;"></div>

## 2.3 Schedule Management Interface
```mermaid
flowchart LR
    subgraph Schedule_Page [Schedule Engine Interface]
        direction TB
        Tabs_Toggle[[Button: View Classes vs View Exams]]
        
        subgraph Assignment_Overlay [Left Panel: Action Form]
            Input_Course[/Input: Course Identifier/]
            Input_Prof[/Input: Designated Professor/]
            Input_DateTime[/Input: Allocator Date/Time/]
            Input_Room[/Input: Room Assign/]
            BTN_Assign[[Button: Assign Class to Database]]
        end
        
        subgraph Visual_Mapping [Right Panel: Calendar]
            Cal_View([Feature: Interactive Weekly/Monthly Temporal Matrix])
            BTN_Book[[Button: Book Counseling Slot Overlay Component]]
        end
    end
```

## 2.4 Counseling & Logistics Portal
```mermaid
flowchart TD
    subgraph Counseling_Page [Counseling Hub]
        Filter_Prof[/Dropdown: Target Teacher/]
        Filter_Date[/Input: Date Parameter Constraint/]
        
        subgraph Roster_Display [Teacher Roster List]
            BTN_ViewSlots[[Button: View Available Scheduling Slots]]
        end
        
        subgraph Booking_Modal [Interactive Booking Overlay Modal]
            Input_Reason[/Input: Meeting Purpose Ledger Textarea/]
            BTN_Confirm[[Button: Confirm Appointment Booking]]
        end
    end
```

## 2.5 Attendance & Feedback Tracker
```mermaid
flowchart LR
    subgraph Trackers [Analytics & Logistics Pages]
        subgraph Attendance_Module [Attendance Interface]
            Matrix([Feature: Live interactive pupil roster matrix])
            BTN_Export[[Button: Export Data as CSV/Excel File]]
        end
        subgraph Feedback_Terminal [Feedback Interface]
            Input_Msg[/Input: Secure Anonymous Insight Textarea/]
            BTN_Submit[[Button: Submit Feedback Data Payload]]
        end
    end
```

<div style="page-break-after: always; break-after: page;"></div>

<div style="text-align: center; margin-top: 150px; color: transparent; user-select: none;">
  <h1>Instructor Feedback Space</h1>
  <p>intentionally left blank</p>
</div>
<!-- Left intentionally blank to enforce exactly 5 printed pages constraints -->

<div style="page-break-after: always; break-after: page;"></div>

<div style="text-align: center; margin-top: 150px; color: transparent; user-select: none;">
  <h1>Instructor Feedback Space</h1>
  <p>intentionally left blank</p>
</div>
<!-- Left intentionally blank to enforce exactly 5 printed pages constraints -->
