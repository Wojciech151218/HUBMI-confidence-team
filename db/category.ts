import "reflect-metadata";
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Document } from "./document";

@Entity({ name: "categories" })
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", unique: true })
  name!: string;

  @ManyToMany(() => Document, (document) => document.categories)
  documents!: Document[];
}
