import "reflect-metadata";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
} from "typeorm";
import type { Initiative } from "./initiative";

@Entity({ name: "initiative_votes" })
@Unique(["initiativeId", "userId"])
export class InitiativeVote {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "integer", name: "initiative_id" })
  initiativeId!: number;

  // Referenced by entity name to avoid a runtime import cycle with ./initiative.
  @ManyToOne("Initiative", "votes", { onDelete: "CASCADE" })
  @JoinColumn({ name: "initiative_id" })
  initiative!: Relation<Initiative>;

  @Column({ type: "integer", name: "user_id" })
  userId!: number;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;
}
