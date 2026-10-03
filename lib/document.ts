import "reflect-metadata";
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

function toVectorLiteral(value: number[] | null): string | null {
  if (!value) {
    return null;
  }

  return `[${value.join(",")}]`;
}

function fromVectorLiteral(value: string | null): number[] | null {
  if (!value) {
    return null;
  }

  return value
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .filter((part) => part.length > 0)
    .map(Number);
}

@Entity({ name: "documents" })
export class Document {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  body!: string;

  @Column({
    type: "text",
    nullable: true,
    transformer: {
      to: toVectorLiteral,
      from: fromVectorLiteral,
    },
  })
  embedding!: number[] | null;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;
}
