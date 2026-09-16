import { db } from '../database/connection';
import { tags, taskTags } from '../database/schema';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { Tag, CreateTagInput, UpdateTagInput } from '@shared/types';

export class TagService {
  list(): Tag[] {
    return db.select().from(tags).orderBy(desc(tags.createdAt)).all() as Tag[];
  }

  create(input: CreateTagInput): Tag {
    const now = new Date().toISOString();
    const newTag = {
      id: nanoid(),
      ...input,
      createdAt: now,
    };
    db.insert(tags).values(newTag).run();
    return newTag as Tag;
  }

  update(id: string, input: UpdateTagInput): Tag {
    db.update(tags).set(input).where(eq(tags.id, id)).run();
    return db.select().from(tags).where(eq(tags.id, id)).get() as Tag;
  }

  delete(id: string): void {
    db.delete(taskTags).where(eq(taskTags.tagId, id)).run();
    db.delete(tags).where(eq(tags.id, id)).run();
  }

  setTaskTags(taskId: string, tagIds: string[]): void {
    db.delete(taskTags).where(eq(taskTags.taskId, taskId)).run();
    if (tagIds.length > 0) {
      const rows = tagIds.map(tagId => ({ taskId, tagId }));
      db.insert(taskTags).values(rows).run();
    }
  }

  getTaskTags(taskId: string): Tag[] {
    const rows = db.select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
      createdAt: tags.createdAt
    })
    .from(tags)
    .innerJoin(taskTags, eq(tags.id, taskTags.tagId))
    .where(eq(taskTags.taskId, taskId))
    .all();
    
    return rows as Tag[];
  }
}

export const tagService = new TagService();
