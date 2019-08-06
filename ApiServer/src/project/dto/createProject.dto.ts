import { IsString, IsArray } from 'class-validator';

export class CreateProjectDTO {
  @IsString()
  title: string;
  @IsString()
  abstract: string;
  // featuredImage: string;
  @IsString()
  context: string;
  @IsString()
  approach: string;
  @IsArray()
  collaborators: Collaborator[];
  @IsString()
  campaignTitle: string;
  @IsString()
  campaignDescription: string;
  @IsArray()
  researchPhases: ResearchPhase[];
}

interface Collaborator {
  fullName: string,
  professionalTitle: string,
  affiliatedOrganisation: string
}

interface ResearchPhase {
  title: string,
  description: string,
  result: string,
  fundingGoal: number,
  duration: number
}
