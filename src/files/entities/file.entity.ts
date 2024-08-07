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

@Entity()
export class File {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, user => user.files)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  name: string;

  @Column('simple-array', { nullable: true })
  shareWith: number[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  isDeleted: boolean;

  @Column()
  uploadedAt: Date;

  @Column()
  size: number;

  @Column()
  ext: string;

  @OneToMany(() => FileShare, fileShare => fileShare.file)
  fileShares: FileShare[];

  @OneToMany(() => AccessRequest, accessRequest => accessRequest.file)
  accessRequests: AccessRequest[];
}