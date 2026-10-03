import "reflect-metadata";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "initiatives" })
export class Initiative {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "text", nullable: true })
  location!: string | null;

  @Column({ type: "text", name: "contact_email" })
  contactEmail!: string;

  @Column({ type: "integer", name: "user_id", nullable: true })
  userId!: number | null;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;
}
