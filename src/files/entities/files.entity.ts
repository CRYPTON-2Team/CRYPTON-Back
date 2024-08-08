import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'metadata_id', unique: true })
  metadataId: string;

  // @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 's3_key' })
  s3Key: string;

  @Column({ name: 's3_url', nullable: true })
  s3Url: string;

  @Column()
  size: number;

  @Column()
  ext: string;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'share_with' })
  shareWith: string;
}
