import { Module } from '@nestjs/common'
import { ContentModule } from './content/content.module'
import { AssignmentsModule } from './assignments/assignments.module'
import { SubmissionsModule } from './submissions/submissions.module'
import { DiscussionsModule } from './discussions/discussions.module'

@Module({
  imports: [ContentModule, AssignmentsModule, SubmissionsModule, DiscussionsModule],
  exports: [ContentModule, AssignmentsModule, SubmissionsModule, DiscussionsModule],
})
export class LmsModule {}
