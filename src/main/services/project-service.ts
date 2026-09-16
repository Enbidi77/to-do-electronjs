import { db } from '../database/connection';
import { projects, tasks } from '../database/schema';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { Project, CreateProjectInput, UpdateProjectInput } from '@shared/types';

export class ProjectService {
  list(): Project[] {
    return db.select().from(projects).orderBy(desc(projects.sortOrder)).all() as Project[];
  }

  get(id: string): Project | null {
    const project = db.select().from(projects).where(eq(projects.id, id)).get();
    return (project as Project) || null;
  }

  create(input: CreateProjectInput): Project {
    const now = new Date().toISOString();
    const newProject = {
      id: nanoid(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    db.insert(projects).values(newProject).run();
    return this.get(newProject.id) as Project;
  }

  update(id: string, input: UpdateProjectInput): Project {
    const now = new Date().toISOString();
    db.update(projects).set({ ...input, updatedAt: now }).where(eq(projects.id, id)).run();
    return this.get(id) as Project;
  }

  delete(id: string): void {
    db.update(tasks).set({ projectId: null }).where(eq(tasks.projectId, id)).run();
    db.delete(projects).where(eq(projects.id, id)).run();
  }

  reorder(ids: string[]): void {
    const now = new Date().toISOString();
    ids.forEach((id, index) => {
      db.update(projects).set({ sortOrder: ids.length - index, updatedAt: now }).where(eq(projects.id, id)).run();
    });
  }
}

export const projectService = new ProjectService();
