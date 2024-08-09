import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { FileShare } from '../../file-shares/entities/file-share.entity';
import { AccessRequest } from '../../access-requests/entities/access-request.entity';

@Entity('file')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column()
  userId: number;

  @Column({ unique: true })
  metadataId: string;

  @ManyToOne(() => User, (user) => user.files)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  s3Key: string;

  @Column({ nullable: false })
  s3Url: string;

  @Column()
  fileName: string;

  @Column('simple-array', { nullable: true })
  shareWith: number[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  isDeleted: boolean;

  @Column()
  fileSize: number;

  @Column()
  mimeType: string;

  @Column()
  ext: string;

  @OneToMany(() => FileShare, (fileShare) => fileShare.file)
  fileShares: FileShare[];

  @OneToMany(() => AccessRequest, (accessRequest) => accessRequest.file)
  accessRequests: AccessRequest[];
}
