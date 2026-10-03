import "reflect-metadata";
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { embeddingDimensions } from "@/lib/embedding";

@Entity({ name: "documents" })
export class Document {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  body!: string;

  @Column({ type: "text", name: "minio_url", nullable: true })
  minioUrl!: string | null;

  @Column({
    type: "vector",
    length: String(embeddingDimensions),
    nullable: true,
  })
  embedding!: number[] | null;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;
}
