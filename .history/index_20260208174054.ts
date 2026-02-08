import {
  SubjectService,
  ProfessorService,
  ClassroomService,
  ScheduleService,
  BreakService,
} from "./services";

async function main() {
  try {
    console.log("=== API Testing ===\n");

    // Step 1: Create Subject
    console.log("1. Creating Subject...");
    const subject = await SubjectService.create({ name: "Математика" });
    console.log("✓ Subject created:", subject);

    // Step 2: Create Professor
    console.log("\n2. Creating Professor...");
    const professor = await ProfessorService.create({ name: "Иван Петров" });
    console.log("✓ Professor created:", professor);

    // Step 3: Create Classroom
    console.log("\n3. Creating Classroom...");
    const classroom = await ClassroomService.create({ number: "101" });
    console.log("✓ Classroom created:", classroom);

    // Step 4: Create Lesson
    console.log("\n4. Creating Lesson...");
    const lesson = await ScheduleService.create({
      startTime: "09:00",
      endTime: "10:30",
      day: 1,
      subjectId: subject.id,
      professorId: professor.id,
      classroomId: classroom.id,
    });
    console.log("✓ Lesson created:", lesson);

    // Step 5: Get All Lessons
    console.log("\n5. Getting Schedule (all lessons)...");
    const schedule = await ScheduleService.getAll();
    console.log("✓ Schedule:", JSON.stringify(schedule, null, 2));

    // Step 6: Create Break
    console.log("\n6. Creating Break...");
    const breakItem = await BreakService.create({
      startTime: "10:30",
      endTime: "10:40",
      day: 1,
    });
    console.log("✓ Break created:", breakItem);

    // Step 7: Get All Breaks
    console.log("\n7. Getting All Breaks...");
    const breaks = await BreakService.getAll();
    console.log("✓ Breaks:", JSON.stringify(breaks, null, 2));

    // Step 8: Update Lesson
    console.log("\n8. Updating Lesson...");
    const updatedLesson = await ScheduleService.update(lesson.id, {
      startTime: "10:00",
      endTime: "11:30",
    });
    console.log("✓ Lesson updated:", updatedLesson);

    // Step 9: Get All Subjects
    console.log("\n9. Getting All Subjects...");
    const subjects = await SubjectService.getAll();
    console.log("✓ Subjects:", JSON.stringify(subjects, null, 2));

    // Step 10: Get All Professors
    console.log("\n10. Getting All Professors...");
    const professors = await ProfessorService.getAll();
    console.log("✓ Professors:", JSON.stringify(professors, null, 2));

    // Step 11: Get All Classrooms
    console.log("\n11. Getting All Classrooms...");
    const classrooms = await ClassroomService.getAll();
    console.log("✓ Classrooms:", JSON.stringify(classrooms, null, 2));

    console.log("\n=== All tests completed successfully! ===");
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
