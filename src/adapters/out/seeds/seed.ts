import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { buildDatabaseOptions } from '../../../config/database.config';

import { UserOrmEntity } from '../orm/user.orm-entity';
import { AdminOrmEntity } from '../orm/admin.orm-entity';
import { ContactOrmEntity } from '../orm/contact.orm-entity';
import { CompanyOrmEntity } from '../orm/company.orm-entity';
import { StudentOrmEntity } from '../orm/student.orm-entity';
import { AccessibilityResourceOrmEntity } from '../orm/accessibility-resource.orm-entity';
import { SocialBenefitOrmEntity } from '../orm/social-benefit.orm-entity';
import { DisabilityOrmEntity } from '../orm/disability.orm-entity';
import { CourseOrmEntity } from '../orm/course.orm-entity';
import { InPersonCourseDetailOrmEntity } from '../orm/in-person-course-detail.orm-entity';
import { SkillOrmEntity } from '../orm/skill.orm-entity';
import { CurriculumOrmEntity } from '../orm/curriculum.orm-entity';
import { CurriculumSkillOrmEntity } from '../orm/curriculum-skill.orm-entity';
import { JobOpeningOrmEntity } from '../orm/job-opening.orm-entity';
import { JobSkillOrmEntity } from '../orm/job-skill.orm-entity';
import { SocialBenefitType } from '../../../core/domain/enums/social-benefit.enum';
import { AccessibilityResourceType } from '../../../core/domain/enums/accessibility-resource.enum';
import {
  EducationLevel,
  Gender,
  HowHeardChannel,
  Race,
} from '../../../core/domain/enums/student-profile.enum';
import { UserRoleEnum } from '../../../core/domain/enums/user-role.enum';

dotenv.config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
  quiet: true,
});

const shouldReset = process.argv.includes('--reset');
const AppDataSource = new DataSource(buildDatabaseOptions());
const studentBirthDates = [
  '1998-03-15',
  '1996-07-22',
  '1999-01-11',
  '1997-09-08',
  '1995-05-19',
  '1993-12-03',
  '2000-02-14',
  '1994-08-27',
  '1998-11-30',
  '1997-06-12',
  '1999-10-05',
  '1992-04-18',
  '1996-01-25',
  '2001-07-09',
  '1998-09-21',
];

function normalizeEducation(value: string): EducationLevel {
  switch (value) {
    case 'ensino_medio':
      return EducationLevel.SECONDARY;
    case 'superior':
      return EducationLevel.HIGHER;
    case 'tecnico':
      return EducationLevel.TECHNICAL;
    case 'pos_graduacao':
      return EducationLevel.POSTGRADUATE;
    default:
      return EducationLevel.OTHER;
  }
}

function normalizeGender(value: string): Gender {
  switch (value) {
    case 'masculino':
      return Gender.MALE;
    case 'feminino':
      return Gender.FEMALE;
    case 'não_binário':
      return Gender.NON_BINARY;
    default:
      return Gender.OTHER;
  }
}

function normalizeRace(value: string): Race {
  switch (value) {
    case 'branca':
      return Race.WHITE;
    case 'preta':
      return Race.BLACK;
    case 'parda':
      return Race.BROWN;
    case 'amarela':
      return Race.ASIAN;
    default:
      return Race.OTHER;
  }
}

async function ensureSeedMode(): Promise<boolean> {
  const userCount = await AppDataSource.getRepository(UserOrmEntity).count();

  if (!shouldReset && userCount > 0) {
    console.log(
      'Seed cancelado: o banco ja possui dados. Use "npm run seed:dev:reset" para recriar tudo.',
    );
    return false;
  }

  if (shouldReset) {
    await AppDataSource.query(`TRUNCATE TABLE
      job_skills, curriculum_skills, skills, job_openings, curriculum,
      in_person_course_details, courses, disabilities,
      social_benefits, accessibility_resources,
      students, admins, companies, contacts, users
      RESTART IDENTITY CASCADE`);
    console.log('Dados anteriores removidos.');
  } else {
    console.log(
      'Banco vazio detectado. Seed inicial sera executado sem reset.',
    );
  }

  return true;
}

async function seed() {
  await AppDataSource.initialize();
  console.log(' Conectado ao banco de dados.');

  const shouldContinue = await ensureSeedMode();

  if (!shouldContinue) {
    await AppDataSource.destroy();
    return;
  }

  const SALT = 10;
  const senhaAdmin = await bcrypt.hash('Admin@123', SALT);
  const senhaEmpresa = await bcrypt.hash('Empresa@123', SALT);
  const senhaAluno = await bcrypt.hash('Aluno@123', SALT);

  // 1. ADMIN
  const adminUserId = uuidv4();
  const adminUser = AppDataSource.getRepository(UserOrmEntity).create({
    id: adminUserId,
    email: 'admin@fatilab.com',
    password: senhaAdmin,
    role: UserRoleEnum.ADMIN,
  });
  await AppDataSource.getRepository(UserOrmEntity).save(adminUser);
  const admin = AppDataSource.getRepository(AdminOrmEntity).create({
    id: adminUserId,
  });
  await AppDataSource.getRepository(AdminOrmEntity).save(admin);
  console.log('Admin criado.');

  // 2. EMPRESAS
  const empresasData = [
    {
      email: 'tech@innovatech.com',
      cnpj: '12.345.678/0001-99',
      responsibleName: 'Carlos Mendes',
      name: 'InnovaTech Soluções',
      phone: '(51) 99111-2222',
      city: 'Porto Alegre',
      state: 'RS',
    },
    {
      email: 'rh@solucoesdigitais.com',
      cnpj: '98.765.432/0001-11',
      responsibleName: 'Fernanda Lima',
      name: 'Soluções Digitais Ltda',
      phone: '(51) 98222-3333',
      city: 'Canoas',
      state: 'RS',
    },
    {
      email: 'vagas@nextera.com',
      cnpj: '45.678.901/0001-55',
      responsibleName: 'Rafael Souza',
      name: 'Nextera Tecnologia',
      phone: '(51) 97333-4444',
      city: 'São Leopoldo',
      state: 'RS',
    },
  ];

  const empresas: CompanyOrmEntity[] = [];
  for (const e of empresasData) {
    const userId = uuidv4();
    const user = AppDataSource.getRepository(UserOrmEntity).create({
      id: userId,
      email: e.email,
      password: senhaEmpresa,
      role: UserRoleEnum.COMPANY,
    });
    await AppDataSource.getRepository(UserOrmEntity).save(user);
    const contact = AppDataSource.getRepository(ContactOrmEntity).create({
      id: userId,
      phone: e.phone,
      city: e.city,
      state: e.state,
    });
    await AppDataSource.getRepository(ContactOrmEntity).save(contact);
    const company = AppDataSource.getRepository(CompanyOrmEntity).create({
      id: userId,
      cnpj: e.cnpj,
      name: e.name,
      responsibleName: e.responsibleName,
      contact: contact,
    });
    await AppDataSource.getRepository(CompanyOrmEntity).save(company);
    empresas.push(company);
  }
  console.log('3 empresas criadas.');

  // 3. CURSOS
  const cursosData = [
    {
      name: 'Desenvolvimento Web Full Stack',
      banner: 'https://fatilab.com/banners/web.jpg',
      description: 'Curso completo de desenvolvimento web com React e Node.js.',
      courseLoad: '120h',
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-06-30'),
      startRegistrations: new Date('2025-01-01'),
      endRegistrations: new Date('2025-01-28'),
      linkAccess: 'https://fatilab.com/cursos/web',
    },
    {
      name: 'Ciência de Dados com Python',
      banner: 'https://fatilab.com/banners/data.jpg',
      description: 'Introdução à análise de dados, pandas e machine learning.',
      courseLoad: '80h',
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-05-31'),
      startRegistrations: new Date('2025-02-01'),
      endRegistrations: new Date('2025-02-25'),
      linkAccess: 'https://fatilab.com/cursos/data',
    },
    {
      name: 'UX/UI Design',
      banner: 'https://fatilab.com/banners/ux.jpg',
      description: 'Design de interfaces e experiência do usuário com Figma.',
      courseLoad: '60h',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-05-31'),
      startRegistrations: new Date('2025-03-01'),
      endRegistrations: new Date('2025-03-28'),
      linkAccess: 'https://fatilab.com/cursos/ux',
    },
    {
      name: 'Infraestrutura e DevOps',
      banner: 'https://fatilab.com/banners/devops.jpg',
      description: 'Docker, Kubernetes, CI/CD e cloud na prática.',
      courseLoad: '100h',
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-08-31'),
      startRegistrations: new Date('2025-04-01'),
      endRegistrations: new Date('2025-04-28'),
      linkAccess: 'https://fatilab.com/cursos/devops',
    },
    {
      name: 'Introdução à Programação',
      banner: 'https://fatilab.com/banners/intro.jpg',
      description: 'Lógica de programação e primeiros passos com JavaScript.',
      courseLoad: '40h',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-02-28'),
      startRegistrations: new Date('2025-01-01'),
      endRegistrations: new Date('2025-01-12'),
      linkAccess: 'https://fatilab.com/cursos/intro',
    },
  ];

  const cursos: CourseOrmEntity[] = [];
  for (const c of cursosData) {
    const curso = AppDataSource.getRepository(CourseOrmEntity).create({
      id: uuidv4(),
      ...c,
    });
    await AppDataSource.getRepository(CourseOrmEntity).save(curso);
    cursos.push(curso);
  }
  console.log('5 cursos criados.');

  // 4. ALUNOS (15)
  const alunosData = [
    {
      name: 'Ana Beatriz Costa',
      city: 'Porto Alegre',
      state: 'RS',
      education: 'ensino_medio',
      disability: 'visual',
      has_disability: true,
      gender: 'feminino',
      color: 'parda',
      area: 'design',
    },
    {
      name: 'Bruno Ferreira',
      city: 'Canoas',
      state: 'RS',
      education: 'superior',
      disability: 'auditiva',
      has_disability: true,
      gender: 'masculino',
      color: 'branca',
      area: 'desenvolvimento',
    },
    {
      name: 'Carla Souza',
      city: 'Gravataí',
      state: 'RS',
      education: 'tecnico',
      disability: 'fisica',
      has_disability: true,
      gender: 'feminino',
      color: 'preta',
      area: 'dados',
    },
    {
      name: 'Diego Almeida',
      city: 'Novo Hamburgo',
      state: 'RS',
      education: 'ensino_medio',
      disability: 'intelectual',
      has_disability: true,
      gender: 'masculino',
      color: 'parda',
      area: 'infraestrutura',
    },
    {
      name: 'Elisa Mendes',
      city: 'São Leopoldo',
      state: 'RS',
      education: 'superior',
      disability: 'psicossocial',
      has_disability: true,
      gender: 'feminino',
      color: 'amarela',
      area: 'design',
    },
    {
      name: 'Felipe Rodrigues',
      city: 'Pelotas',
      state: 'RS',
      education: 'pos_graduacao',
      disability: 'multipla',
      has_disability: true,
      gender: 'masculino',
      color: 'branca',
      area: 'gestao',
    },
    {
      name: 'Gabriela Nunes',
      city: 'Santa Maria',
      state: 'RS',
      education: 'tecnico',
      disability: 'TEA',
      has_disability: true,
      gender: 'feminino',
      color: 'preta',
      area: 'desenvolvimento',
    },
    {
      name: 'Henrique Oliveira',
      city: 'Porto Alegre',
      state: 'RS',
      education: 'ensino_medio',
      disability: 'outra',
      has_disability: true,
      gender: 'masculino',
      color: 'parda',
      area: 'dados',
    },
    {
      name: 'Isabela Lima',
      city: 'Caxias do Sul',
      state: 'RS',
      education: 'superior',
      disability: 'nenhuma',
      has_disability: false,
      gender: 'feminino',
      color: 'branca',
      area: 'design',
    },
    {
      name: 'João Pedro Santos',
      city: 'Porto Alegre',
      state: 'RS',
      education: 'tecnico',
      disability: 'nenhuma',
      has_disability: false,
      gender: 'masculino',
      color: 'preta',
      area: 'infraestrutura',
    },
    {
      name: 'Karen Vieira',
      city: 'Viamão',
      state: 'RS',
      education: 'ensino_medio',
      disability: 'visual',
      has_disability: true,
      gender: 'não_binário',
      color: 'parda',
      area: 'desenvolvimento',
    },
    {
      name: 'Lucas Martins',
      city: 'Alvorada',
      state: 'RS',
      education: 'pos_graduacao',
      disability: 'auditiva',
      has_disability: true,
      gender: 'masculino',
      color: 'branca',
      area: 'dados',
    },
    {
      name: 'Mariana Pereira',
      city: 'Porto Alegre',
      state: 'RS',
      education: 'superior',
      disability: 'fisica',
      has_disability: true,
      gender: 'feminino',
      color: 'parda',
      area: 'gestao',
    },
    {
      name: 'Nicolas Carvalho',
      city: 'Esteio',
      state: 'RS',
      education: 'ensino_medio',
      disability: 'nenhuma',
      has_disability: false,
      gender: 'masculino',
      color: 'preta',
      area: 'design',
    },
    {
      name: 'Olivia Ferreira',
      city: 'Porto Alegre',
      state: 'RS',
      education: 'tecnico',
      disability: 'psicossocial',
      has_disability: true,
      gender: 'feminino',
      color: 'amarela',
      area: 'desenvolvimento',
    },
  ];

  const normalizedAlunosData = alunosData.map((student, index) => ({
    ...student,
    birthDate: studentBirthDates[index],
    education: normalizeEducation(student.education),
    gender: normalizeGender(student.gender),
    race: normalizeRace(student.color),
    hasDisability: student.has_disability,
    howHeard: [
      HowHeardChannel.INSTAGRAM,
      HowHeardChannel.REFERRAL,
      HowHeardChannel.GOOGLE,
      HowHeardChannel.EVENT,
    ][index % 4],
  }));

  const alunos: StudentOrmEntity[] = [];
  for (let i = 0; i < normalizedAlunosData.length; i++) {
    const a = normalizedAlunosData[i];
    const userId = uuidv4();
    const numero = String(i + 1).padStart(2, '0');
    const user = AppDataSource.getRepository(UserOrmEntity).create({
      id: userId,
      email: `aluno${numero}@fatilab.com`,
      password: senhaAluno,
      role: UserRoleEnum.STUDENT,
    });
    await AppDataSource.getRepository(UserOrmEntity).save(user);
    const contact = AppDataSource.getRepository(ContactOrmEntity).create({
      id: userId,
      phone: `(51) 90000-${numero}00`,
      city: a.city,
      state: a.state,
    });
    await AppDataSource.getRepository(ContactOrmEntity).save(contact);
    const student = AppDataSource.getRepository(StudentOrmEntity).create({
      id: userId,
      contact: contact,
      cpf: `${100000000 + i * 11111111}`.slice(0, 11),
      birthDate: new Date(a.birthDate),
      education: a.education,
      gender: a.gender,
      race: a.race,
      activityArea: a.area,
      hasProgrammingExperience: i % 2 === 0,
      hasTechnologyCourse: i % 3 !== 0,
      hasComputer: true,
      hasInternet: true,
      committedToParticipate: true,
      sendCurriculum: i % 2 === 0,
      motivation: `Quero desenvolver habilidades em ${a.area} para ingressar no mercado de trabalho.`,
      howHeard: a.howHeard,
    });
    await AppDataSource.getRepository(StudentOrmEntity).save(student);

    const disability = AppDataSource.getRepository(DisabilityOrmEntity).create({
      studentId: userId,
      hasDisability: a.hasDisability,
      description: a.hasDisability ? a.disability : null,
      hasReport: a.hasDisability ? 'sim' : null,
      type: a.hasDisability ? a.disability : null,
    });
    await AppDataSource.getRepository(DisabilityOrmEntity).save(disability);

    if (i % 3 === 0) {
      const benefit = AppDataSource.getRepository(
        SocialBenefitOrmEntity,
      ).create({
        student: student,
        benefit: [
          SocialBenefitType.bolsaFamilia,
          SocialBenefitType.bpc,
          SocialBenefitType.auxilioDoenca,
        ][i % 3],
      });
      await AppDataSource.getRepository(SocialBenefitOrmEntity).save(benefit);
    }
    if (a.hasDisability) {
      const resource = AppDataSource.getRepository(
        AccessibilityResourceOrmEntity,
      ).create({
        student: student,
        resource: AccessibilityResourceType.other,
      });
      await AppDataSource.getRepository(AccessibilityResourceOrmEntity).save(
        resource,
      );
    }
    alunos.push(student);
  }
  console.log('15 alunos criados.');

  // CURSOS PRESENCIAIS
  const cursosPresenciais = [cursos[0], cursos[1]];
  for (let pc = 0; pc < cursosPresenciais.length; pc++) {
    const personCourse = AppDataSource.getRepository(
      InPersonCourseDetailOrmEntity,
    ).create({
      id: uuidv4(),
      course: cursosPresenciais[pc],
      address: ['Porto Alegre', 'Canoas'][pc],
      startDate: cursosPresenciais[pc].startDate,
      shift: ['manha', 'tarde'][pc],
      room: `Sala ${pc + 1}`,
      vacancies: 30,
    });
    await AppDataSource.getRepository(InPersonCourseDetailOrmEntity).save(
      personCourse,
    );
  }
  console.log('2 cursos presenciais criados.');

  // 5. SKILLS
  const skillNames = [
    'JavaScript',
    'TypeScript',
    'Python',
    'React',
    'Node.js',
    'SQL',
    'Figma',
    'Docker',
    'Git',
    'Excel',
  ];
  const skills: SkillOrmEntity[] = [];
  for (const name of skillNames) {
    const skill = AppDataSource.getRepository(SkillOrmEntity).create({
      id: uuidv4(),
      name,
    });
    await AppDataSource.getRepository(SkillOrmEntity).save(skill);
    skills.push(skill);
  }
  console.log('Skills criadas.');

  // 6. CURRÍCULOS (2)
  const curriculoAlunos = [alunos[0], alunos[1]];
  for (let i = 0; i < curriculoAlunos.length; i++) {
    const aluno = curriculoAlunos[i];
    const curriculo = AppDataSource.getRepository(CurriculumOrmEntity).create({
      id: uuidv4(),
      student: aluno,
      isAvailable: true,
      about: `Profissional em formação com interesse em tecnologia.`,
      linkedin: `https://linkedin.com/in/aluno0${i + 1}`,
      github: `https://github.com/aluno0${i + 1}`,
      videoPresentation: `https://fatilab.com/videos/aluno0${i + 1}`,
    });
    await AppDataSource.getRepository(CurriculumOrmEntity).save(curriculo);
    for (let j = 0; j < 3; j++) {
      const sc = AppDataSource.getRepository(CurriculumSkillOrmEntity).create({
        curriculumId: curriculo.id,
        skillId: skills[j + i * 3].id,
      });
      await AppDataSource.getRepository(CurriculumSkillOrmEntity).save(sc);
    }
  }
  console.log('2 currículos com skills criados.');

  // 7. VAGAS (5)
  const vagasData = [
    {
      name: 'Desenvolvedor Frontend',
      description: 'Vaga para dev React.',
      openingsCount: 2,
      isPcd: true,
      company: empresas[0],
    },
    {
      name: 'Analista de Dados',
      description: 'Python e SQL obrigatório.',
      openingsCount: 1,
      isPcd: false,
      company: empresas[0],
    },
    {
      name: 'Designer UX/UI',
      description: 'Figma e pesquisa de UX.',
      openingsCount: 3,
      isPcd: true,
      company: empresas[1],
    },
    {
      name: 'Engenheiro DevOps',
      description: 'Docker, K8s e AWS.',
      openingsCount: 1,
      isPcd: false,
      company: empresas[1],
    },
    {
      name: 'Desenvolvedor Full Stack',
      description: 'Node.js + React.',
      openingsCount: 2,
      isPcd: true,
      company: empresas[2],
    },
  ];
  for (let i = 0; i < vagasData.length; i++) {
    const v = vagasData[i];
    const job = AppDataSource.getRepository(JobOpeningOrmEntity).create({
      name: v.name,
      description: v.description,
      openingsCount: v.openingsCount,
      isPcd: v.isPcd,
      company: v.company,
    });
    await AppDataSource.getRepository(JobOpeningOrmEntity).save(job);
    for (let j = 0; j < 2; j++) {
      const sj = AppDataSource.getRepository(JobSkillOrmEntity).create({
        jobId: job.id,
        skillId: skills[(i + j) % skills.length].id,
      });
      await AppDataSource.getRepository(JobSkillOrmEntity).save(sj);
    }
  }
  console.log('5 vagas com skills criadas.');
  console.log('\nResumo do dataset gerado:');
  console.log('- 1 admin');
  console.log('- 3 empresas');
  console.log('- 5 cursos');
  console.log('- 2 cursos presenciais');
  console.log('- 15 alunos');
  console.log('- 10 skills');
  console.log('- 2 curriculos');
  console.log('- 5 vagas');
  console.log('\nExemplos reais do seed:');
  console.log('- Admin: admin@fatilab.com | senha: Admin@123 | role: ADMIN');
  console.log(
    '- Empresa: tech@innovatech.com | InnovaTech Solucoes | CNPJ: 12.345.678/0001-99',
  );
  console.log(
    '- Empresa: rh@solucoesdigitais.com | Solucoes Digitais Ltda | CNPJ: 98.765.432/0001-11',
  );
  console.log(
    '- Curso: Desenvolvimento Web Full Stack | carga: 120h | inicio: 2025-02-01',
  );
  console.log(
    '- Curso: Ciencia de Dados com Python | carga: 80h | inicio: 2025-03-01',
  );
  console.log(
    '- Aluno: aluno01@fatilab.com | Ana Beatriz Costa | area: design',
  );
  console.log(
    '- Aluno: aluno02@fatilab.com | Bruno Ferreira | area: desenvolvimento',
  );
  console.log(
    '- Vaga: Desenvolvedor Frontend | empresa: InnovaTech Solucoes | vagas: 2 | PCD: sim',
  );
  console.log(
    '- Vaga: Engenheiro DevOps | empresa: Solucoes Digitais Ltda | vagas: 1 | PCD: nao',
  );
  console.log(
    '- Skills de exemplo: JavaScript, TypeScript, Python, React, Node.js, SQL',
  );

  console.log('\nSeed concluído com sucesso!');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
