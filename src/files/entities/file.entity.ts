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

  // fileOwnerId? userId? - 파일 소유자를 분명히하기 위해서 통일하려고 함.
  @Column()
  fileOwnerId: number;

  @ManyToOne(() => User, (user) => user.ownedfiles)
  @JoinColumn({ name: 'fileOwnerId' })
  fileOwner: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ unique: true })
  metadataId: string;

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
