import { Controller, UseGuards, Get, Post, UseInterceptors, Req, Body, UploadedFile } from '@nestjs/common';
import { ProjectService } from './project.service';
import { RolesGuard } from 'src/common/roles.guard';
import { Roles } from 'src/common/roles.decorator';
import { UserType, User } from '../user/user.schema';
import { Project } from './project.schema';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptorHelper, FileOptions } from 'src/helpers/fileInterceptorHelper';
import { SubmitProjectDTO } from './dto/submitProject.dto'

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get('all')
  async getAllProjects(): Promise<Project[]> {
    const result = await this.projectService.getAllProjects();
    return result;
  }

  @Get('awaitingApproval')
  async getAwaitingApprovalProjects(): Promise<Project[]> {
    const result = await this.projectService.getAllProjects();
    return result;
  }

  @Post('submit')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ProjectCreator)
  @UseInterceptors(FileInterceptorHelper({
    name: 'featuredImage',
    maxCount: 1,
    type: FileOptions.PICTURE,
  }))
  
  async submitProject(@Req() req: Request & { user: User },
    @Body() reqBody: SubmitProjectDTO,
    @UploadedFile() file) {
    const result = await this.projectService.submit(reqBody, file, req.user);
    return result;
  }
}
