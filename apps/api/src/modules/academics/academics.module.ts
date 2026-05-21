import { Module } from '@nestjs/common'
import { DepartmentsModule } from './departments/departments.module'
import { CoursesModule } from './courses/courses.module'
import { AcademicYearsModule } from './academic-years/academic-years.module'
import { EnrollmentsModule } from './enrollments/enrollments.module'
import { GradesModule } from './grades/grades.module'
import { AttendanceModule } from './attendance/attendance.module'

@Module({
  imports: [
    DepartmentsModule,
    CoursesModule,
    AcademicYearsModule,
    EnrollmentsModule,
    GradesModule,
    AttendanceModule,
  ],
  exports: [
    DepartmentsModule,
    CoursesModule,
    AcademicYearsModule,
    EnrollmentsModule,
    GradesModule,
    AttendanceModule,
  ],
})
export class AcademicsModule {}
