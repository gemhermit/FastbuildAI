# Tasks

## Backend
- [ ] Create `UserSchedule` entity and migration in `packages/api`. <!-- id: create-schedule-entity -->
- [ ] Implement `UserScheduleService` with CRUD methods (create, update, delete, find). <!-- id: implement-schedule-service -->
- [ ] Implement `AIScheduleService` using `@buildingai/ai-sdk` to handle LLM interaction. <!-- id: implement-ai-schedule-service -->
- [ ] Create `UserScheduleController` with endpoints for AI chat (`/parse`) and execution (`/execute`). <!-- id: create-schedule-controller -->
- [ ] Register `UserScheduleModule` in `app.module.ts`. <!-- id: register-module -->
- [ ] Add unit tests for `UserScheduleService` and `AIScheduleService`. <!-- id: test-backend-services -->

## Frontend
- [ ] Create `ScheduleCard` component to display event details and actions. <!-- id: create-schedule-card -->
- [ ] Create `AIChatWidget` component for the conversational interface. <!-- id: create-ai-chat-widget -->
- [ ] Integrate `AIChatWidget` into the main layout or calendar page. <!-- id: integrate-chat-widget -->
- [ ] Implement API client methods for schedule AI endpoints. <!-- id: implement-frontend-api -->

## Integration & Verification
- [ ] Verify end-to-end flow: User types -> AI parses -> Card shows -> User confirms -> Event created. <!-- id: verify-e2e-flow -->
- [ ] Verify error handling and ambiguity resolution. <!-- id: verify-error-handling -->
