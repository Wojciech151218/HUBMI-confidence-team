import "reflect-metadata";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { embeddingDimensions } from "@/lib/embedding";
import { Category } from "./category";

@Entity({ name: "documents" })
export class Document {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", nullable: true })
  title!: string | null;

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

  @ManyToMany(() => Category, (category) => category.documents)
  @JoinTable({
    name: "document_categories",
    joinColumn: { name: "document_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "category_id", referencedColumnName: "id" },
  })
  categories!: Category[];

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;
}
