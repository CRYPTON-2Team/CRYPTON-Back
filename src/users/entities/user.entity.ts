import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { File } from '../../files/entities/file.entity';
import { FileShare } from '../../file-shares/entities/file-share.entity';
import { AccessRequest } from '../../access-requests/entities/access-request.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @OneToMany(() => File, (file) => file.fileOwner)
  ownedfiles: File[];

  @Column({ unique: true })
  username: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ default: null })
  profileImgUrl: string;

  @OneToMany(() => FileShare, (fileShare) => fileShare.user)
  fileShares: FileShare[];

  @OneToMany(() => AccessRequest, (accessRequest) => accessRequest.requester)
  sentAccessRequests: AccessRequest[];

  @OneToMany(() => AccessRequest, (accessRequest) => accessRequest.fileOwner)
  receivedAccessRequests: AccessRequest[];
}
