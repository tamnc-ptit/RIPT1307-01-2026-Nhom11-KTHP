# LECTURER FEATURES - COMPLETE IMPLEMENTATION PLAN
**Project:** Thesis Management System (Đồ án Tốt nghiệp)
**Target Role:** Giảng viên (Lecturer)
**Date:** 2026-05-24
**Based on:** `abc.sql` schema + existing partial implementation

---

## 1. GOAL
Deliver a **complete, production-ready** lecturer module covering the full academic workflow:
- Thesis proposal management
- Student registration approval
- Class & group oversight
- Milestone template configuration
- Real-time progress tracking + grading
- Final scoring & reporting
- Risk alerts & notifications

Everything must be **fully functional** from **Frontend ↔ Backend ↔ Database** using the existing schema.

---

## 2. CURRENT STATE (What Already Exists)

### Frontend (Lecturer pages)
- `/lecturer/dashboard` – Basic stats + risk flags + recent theses (partially populated)
- `/lecturer/thesis-management` – Full CRUD + approve/reject/finalize + export
- `/lecturer/class-groups` – Class selector + student list + thesis status + export
- `/lecturer/templates` – Milestone template CRUD per class
- `/lecturer/milestones` – Steps + table + grade modal + add custom milestone
- `/lecturer/session` – Session/registration period config per class

### Backend
- `lecturer.controller.js` + `lecturer.service.js` – Most endpoints implemented
- `milestone.service.js` – Get, create, feedback update working
- Excel export (class report) functional
- Approve flow copies MilestoneTemplates → Milestones (good)

### Database (abc.sql)
- Full schema support for all lecturer flows
- Key tables: `Thesis`, `Milestones`, `MilestoneTemplates`, `Submissions`, `Comments`, `Classes`, `ClassStudents`, `Sessions`, `TopicSuggestions`, `Users`

### Known Gaps / Issues
- `final_score` column on Thesis is never updated (uses hack in `lecturer_note`)
- `studentName` often missing in thesis list
- No real file preview for lecturer when grading
- No notifications sent to students on lecturer actions
- Lecturer cannot manage their own **TopicSuggestions** (proposals)
- No detailed thesis view / submission history
- Risk flags logic is basic
- No audit logging for lecturer actions in many places
- No charts / visual progress
- Some type mismatches between FE and BE

---

## 3. FEATURE BREAKDOWN (Prioritized)

### Phase 1 – Core Stability (Must Have – Week 1)
1. **Thesis List Improvements**
   - Fix `studentName`, `className` population in `getThesisList` for lecturer
   - Add filters: status, class, session
   - Add search + pagination on backend
   - Show proposal vs registered clearly

2. **Finalize Thesis – Real Final Score**
   - Update `finalizeThesis` to set `final_score` column + `status = 'completed'`
   - Remove hack from `lecturer_note`

3. **Milestone Grading UX Polish**
   - Show actual submission file (view/download)
   - Show all previous comments in grading modal
   - Allow lecturer to mark "late" manually

4. **Dashboard – Accurate Live Data**
   - Fix risk flags query (use proper `updated_at` + real overdue logic)
   - Add quick stats cards with real counts

### Phase 2 – Lecturer Proposal System (High Value – Week 1-2)
5. **TopicSuggestions Management (Lecturer)**
   - New page or tab: "Đề tài đề xuất của tôi"
   - CRUD for `TopicSuggestions` (title, description, max_groups, status)
   - Status: open / closed / draft
   - Students can register against these (already partially in DB)

6. **Link Proposal to Thesis**
   - When student registers a lecturer proposal, auto-fill `suggestion_id`

### Phase 3 – Monitoring & Communication (Week 2)
7. **Detailed Thesis View Page**
   - Route: `/lecturer/thesis/:id`
   - Show full info + all milestones + all submissions history + comments
   - Timeline view

8. **Submission History & File Viewer**
   - For each milestone: list of submissions (student can resubmit)
   - Lecturer can view latest file + all versions

9. **Notifications to Students**
   - On approve/reject thesis
   - On milestone graded
   - On final score published
   - Use existing `Notifications` table

10. **Audit Logging**
    - Log all lecturer actions (`APPROVE`, `REJECT`, `GRADE`, `CREATE_MILESTONE`, etc.) into `AuditLogs`

### Phase 4 – Reporting & Analytics (Week 3)
11. **Enhanced Excel Export**
    - Include milestone scores, final score, submission dates
    - Multiple sheets: Summary + Detail per milestone

12. **Visual Dashboard**
    - Progress pie/bar charts per class
    - Risk heatmap (students overdue)

13. **Bulk Actions**
    - Bulk approve/reject pending theses
    - Bulk export selected classes

### Phase 5 – Polish & Edge Cases (Week 3-4)
14. **Permission Checks**
    - Every lecturer endpoint must verify ownership (class/thesis belongs to them)

15. **Student View Consistency**
    - Ensure lecturer actions reflect correctly on student side (already mostly done via shared tables)

16. **Error Handling & Loading States**
    - Consistent toasts, skeletons, empty states

17. **Mobile Responsiveness** for all lecturer pages

---

## 4. DETAILED FEATURE SPEC (with FE/BE/DB Impact)

### A. TopicSuggestions for Lecturers
**New Frontend Page:** `src/pages/Lecturer/MyProposals.tsx`
- Table + form to create/edit/close proposals
- Filter by session

**Backend:**
- New or extend `lecturer.routes.js`:
  - `GET /api/lecturer/proposals`
  - `POST /api/lecturer/proposals`
  - `PUT /api/lecturer/proposals/:id`
  - `DELETE /api/lecturer/proposals/:id`

**Service:** `lecturer.service.js` – add CRUD for `TopicSuggestions` filtered by `lecturer_id`

**DB:** Already perfect (`TopicSuggestions` table exists)

### B. Real Final Score
**Change in `lecturer.service.js`:**
```sql
UPDATE Thesis 
SET final_score = @finalScore, 
    status = 'completed',
    lecturer_status = 'approved',
    admin_status = 'approved',
    updated_at = GETDATE()
WHERE id = @id
```

Remove the `lecturer_note` hack.

### C. Detailed Thesis View + Submissions
**New Page:** `src/pages/Lecturer/ThesisDetail.tsx`
- Use `thesisId` from URL
- Fetch full thesis + milestones + submissions + comments
- New backend endpoint: `GET /api/lecturer/theses/:id/detail`

**Service:** Join `Thesis + Milestones + Submissions + Comments + Users`

### D. Notifications
After every lecturer action (approve, reject, grade, finalize):
```js
await createNotification({
  user_id: studentId,
  type: 'thesis_approved' | 'submission_graded' | ...,
  title, message, ref_type, ref_id
})
```

Reuse existing `Notifications` table + service if available.

### E. Risk Flags – Improved Query
Better overdue detection:
```sql
WHERE m.deadline < GETDATE() 
  AND m.status = 'pending'
  AND t.lecturer_status = 'approved'
```

Add "no submission after 7 days of deadline" flag.

---

## 5. IMPLEMENTATION PHASES & TASK LIST

### Phase 1 (Immediate – 3-4 days)
- [ ] Fix thesis list data (studentName, className)
- [ ] Fix `finalizeThesis` to use real `final_score`
- [ ] Add file preview in grading modal
- [ ] Improve dashboard risk flags

### Phase 2 (High Priority – 5-7 days)
- [ ] Build full **My Proposals** (TopicSuggestions) management
- [ ] Create **Thesis Detail** page with full history
- [ ] Add notifications on lecturer actions
- [ ] Add audit logs for lecturer actions

### Phase 3 (Enhancement – 4-5 days)
- [ ] Enhanced Excel report (multiple sheets + milestone details)
- [ ] Visual charts on dashboard
- [ ] Bulk actions + better filtering

### Phase 4 (Polish – 3 days)
- [ ] Permission hardening
- [ ] Error boundaries, loading, responsive
- [ ] End-to-end testing with real lecturer flow

---

## 6. FILE CREATION / MODIFICATION SUMMARY

**New Files (Frontend)**
- `src/pages/Lecturer/MyProposals.tsx`
- `src/pages/Lecturer/ThesisDetail.tsx`
- `src/types/LecturerTypes/Proposals.ts`
- `src/types/LecturerTypes/ThesisDetail.ts`

**New/Modified Backend**
- `backend/routes/lecturer.routes.js` – add proposal routes
- `backend/controllers/lecturer.controller.js` – proposal handlers + detail
- `backend/services/lecturer.service.js` – proposal CRUD + getThesisDetail + notifications
- `backend/services/notification.service.js` (create if missing)

**Database** – No schema changes needed (all tables exist)

---

## 7. SUCCESS CRITERIA
- A lecturer can:
  1. Create and manage their own topic proposals
  2. Approve/reject student registrations with proper status updates
  3. Define milestone templates per class
  4. See live progress of every thesis
  5. Grade submissions with scores + comments + see files
  6. Publish final scores that students can see
  7. Export professional class reports
  8. Receive alerts for at-risk students
  9. All actions are logged and students are notified

---

## 8. NEXT STEP
Once this plan is approved, I will start **Phase 1** immediately by creating/updating the necessary files.

**Ready to begin implementation?** Just say the word and I will start coding Phase 1.

---

**Document Version:** 1.0  
**Maintained by:** Kilo AI Assistant
