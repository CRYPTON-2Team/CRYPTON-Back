import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { File } from '../../files/entities/file.entity';
import { FileShare } from '../../file-shares/entities/file-share.entity';
import { AccessRequest } from '../../access-requests/entities/access-request.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @OneToMany(() => File, file => file.user)
  files: File[];

  @OneToMany(() => FileShare, fileShare => fileShare.user)
  fileShares: FileShare[];

  @OneToMany(() => AccessRequest, accessRequest => accessRequest.fileOwner)
  sentAccessRequests: AccessRequest[];
}