import { Schema, Document } from 'mongoose';
import { Schemas } from 'src/app.constants';
import { ObjectId } from 'mongodb';
import { Attachment } from 'src/attachment/attachment.schema';
import { User } from 'src/user/user.schema';
import { spreadEnumKeys } from 'src/helpers/spreadEnum';

export interface Project extends IProject {
  id: string;
}

export enum ProjectSubmissionStatus {
  created,
  accepted,
  rejected,
  started,
  ended
}

interface IProject {
  user: User | ObjectId | string;
  title: string,
  abstract: string,
  featuredImage: Attachment | ObjectId | String,
  context: string,
  approach: string,
  collaborators: Collaborator[],
  researchPhases: ResearchPhase[],
  status: ProjectSubmissionStatus,
  reviewedBy: User | ObjectId | string,
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
  duration: number,
}

let CollaboratorSchema = new Schema({
  fullName: { type: String, required: true },
  professionalTitle: { type: String, required: true },
  affiliatedOrganisation: { type: String, required: true },
}, {
    _id: false,
    id: false
  });

let ResearchPhaseSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  result: { type: String, required: true },
  fundingGoal: { type: Number, required: true },
  duration: { type: Number, required: true },
}, {
    _id: false,
    id: false
  });

export interface ProjectDocument extends IProject, Document { }

export const ProjectSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: Schemas.User, required: true },
  title: { type: String, required: true },
  abstract: { type: String, required: true },
  featuredImage: { type: Schema.Types.ObjectId, ref: Schemas.Attachment, required: true },
  context: { type: String, required: true },
  approach: { type: String, required: true },
  collaborators: { type: [CollaboratorSchema], required: true },
  researchPhases: { type: [ResearchPhaseSchema], required: true },
  status: { type: Number, required: true, default: ProjectSubmissionStatus.created, enum: [...spreadEnumKeys(ProjectSubmissionStatus)] },
  reviewedBy: { type: Schema.Types.ObjectId, ref: Schemas.User, required: false }
}, {
    timestamps: true,
    toJSON: {
      getters: true,
      versionKey: false,
      transform: (doc, ret) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
      virtuals: true,
    },
    toObject: {
      getters: true,
      versionKey: false,
      transform: (doc, ret) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  });