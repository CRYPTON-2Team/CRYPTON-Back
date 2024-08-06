import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { File } from '../../files/entities/file.entity';
import { ShareLink } from '../../file-share/entities/share-link.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @OneToMany(() => File, (file) => file.owner)
  uploadedFiles: File[];

  @OneToMany(() => ShareLink, (shareLink) => shareLink.creator)
  createdShareLinks: ShareLink[];
}
