import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Project } from './project.schema';
import { Model } from 'mongoose';
import { ProjectDocument } from './project.schema';
import { Schemas } from '../app.constants';
import { SubmitProjectDTO } from './dto/submitProject.dto';
import { AttachmentService } from 'src/attachment/attachment.service';
import { User } from 'src/user/user.schema';
import { ProjectSubmissionStatus } from './project.schema';

@Injectable()
export class ProjectService {
  constructor(@InjectModel(Schemas.Project) private readonly projectRepository: Model<ProjectDocument>,
  private readonly attachmentService: AttachmentService) {}
  
  async submit(projectData: SubmitProjectDTO, file: any, user: User): Promise<Project> {
    const project = await new this.projectRepository({...projectData, user: user.id});
    if (file) {
      const attachment = await this.attachmentService.create({
        filename: `${project.id}-${file.originalname}`,
        contentType: file.mimetype
      }, file);
      project.featuredImage = attachment;
    }
    
    await project.save();
    return project.toObject();
  }
  
  async getProjects() {
    const result = await this.projectRepository
      .find({status: ProjectSubmissionStatus.started})
      .populate(Schemas.User, 'fullName profileImage biography professionalTitle affiliatedOrganisation');
    return result.map(r => r.toObject())
  }

  async getAllProjects(): Promise<Project[]> {
    const result = await this.projectRepository.find().populate(Schemas.User);
    return result.map(r => r.toObject())
  }

  async getUserProjects(userId: string) {
    const result = await this.projectRepository.find({user: userId}).populate(Schemas.User);
    return result.map(r => r.toObject());
  }
  
  async findById(projectId: string): Promise<Project> {
    const project = await this.projectRepository.findById(projectId);
    return project ? project.toObject() : false;
  }

  async approveProject(projectId: any, user: User) {
    const project = await this.projectRepository.findById(projectId);
    project.status = ProjectSubmissionStatus.accepted;
    project.reviewedBy = user.id;
    await project.save();
    return project.toObject();
  }

  async rejectProject(projectId: any, user: User) {
    const project = await this.projectRepository.findById(projectId);
    project.status = ProjectSubmissionStatus.rejected;
    project.reviewedBy = user.id;
    await project.save();
    return project.toObject();
  }
}
