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
import { SocialBenefitOrmEntity } from '../orm/social-benefit.orm-entity';
import { DisabilityOrmEntity } from '../orm/disability.orm-entity';
import { CourseOrmEntity } from '../orm/course.orm-entity';
import { InPersonCourseDetailOrmEntity } from '../orm/in-person-course-detail.orm-entity';
import { SettingOrmEntity } from '../orm/setting.orm-entity';
import { SkillOrmEntity } from '../orm/skill.orm-entity';
import { CurriculumOrmEntity } from '../orm/curriculum.orm-entity';
import { CurriculumSkillOrmEntity } from '../orm/curriculum-skill.orm-entity';
import { JobOpeningOrmEntity } from '../orm/job-opening.orm-entity';
import { JobSkillOrmEntity } from '../orm/job-skill.orm-entity';
import { SocialBenefitType } from '../../../core/domain/enums/social-benefit.enum';
import {
  EducationLevel,
  Gender,
  HowHeardChannel,
  Race,
  FamilyIncome,
} from '../../../core/domain/enums/student-profile.enum';
import { UserRoleEnum } from '../../../core/domain/enums/user-role.enum';
import { AmoresFatiLogger } from '../../../utils/logger';

dotenv.config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
  quiet: true,
});

const logger = new AmoresFatiLogger().setContext('Seed');

const shouldReset = process.argv.includes('--reset');
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
      return EducationLevel.SECONDARY;
    case 'pos_graduacao':
      return EducationLevel.POSTGRADUATE;
    default:
      return EducationLevel.NO_EDUCATION;
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
      return Race.INDIGENOUS;
    default:
      return Race.PREFER_NOT_TO_SAY;
  }
}

async function ensureSeedMode(appDataSource: DataSource): Promise<boolean> {
  const userCount = await appDataSource.getRepository(UserOrmEntity).count();

  if (!shouldReset && userCount > 0) {
    logger.info(
      'Seed cancelado: o banco ja possui dados. Use "npm run seed:dev:reset" para recriar tudo.',
    );
    return false;
  }

  if (shouldReset) {
    await appDataSource.query(`TRUNCATE TABLE
      job_skills, curriculum_skills, skills, job_openings, curriculum,
      in_person_course_details, courses, disabilities,
      social_benefits,
      students, admins, companies, contacts, users, settings
      RESTART IDENTITY CASCADE`);
    logger.info('Dados anteriores removidos.');
  } else {
    logger.info(
      'Banco vazio detectado. Seed inicial sera executado sem reset.',
    );
  }

  return true;
}

export async function seed(): Promise<void> {
  const appDataSource = new DataSource(buildDatabaseOptions());
  await appDataSource.initialize();
  logger.info(' Conectado ao banco de dados.');

  const shouldContinue = await ensureSeedMode(appDataSource);

  if (!shouldContinue) {
    await appDataSource.destroy();
    return;
  }

  const SALT = 10;
  const senhaAdmin = await bcrypt.hash('Admin@123', SALT);
  const senhaEmpresa = await bcrypt.hash('Empresa@123', SALT);
  const senhaAluno = await bcrypt.hash('Aluno@123', SALT);

  // 1. ADMIN
  const adminUserId = uuidv4();
  const adminUser = appDataSource.getRepository(UserOrmEntity).create({
    id: adminUserId,
    email: 'admin@fatilab.com',
    password: senhaAdmin,
    role: UserRoleEnum.ADMIN,
  });
  await appDataSource.getRepository(UserOrmEntity).save(adminUser);
  const admin = appDataSource.getRepository(AdminOrmEntity).create({
    id: adminUserId,
  });
  await appDataSource.getRepository(AdminOrmEntity).save(admin);
  logger.info('Admin criado.');
  
  // 1.1 CONFIGURAÇÕES GERAIS
  const whatsappSetting = appDataSource.getRepository(SettingOrmEntity).create({
    id: uuidv4(),
    key: 'whatsapp_phone',
    value: '(51) 99266-9381',
  });
  await appDataSource.getRepository(SettingOrmEntity).save(whatsappSetting);
  logger.info('Configuração de WhatsApp seedada.');

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
    const user = appDataSource.getRepository(UserOrmEntity).create({
      id: userId,
      email: e.email,
      password: senhaEmpresa,
      role: UserRoleEnum.COMPANY,
    });
    await appDataSource.getRepository(UserOrmEntity).save(user);
    const contact = appDataSource.getRepository(ContactOrmEntity).create({
      id: userId,
      phone: e.phone,
      city: e.city,
      state: e.state,
    });
    await appDataSource.getRepository(ContactOrmEntity).save(contact);
    const company = appDataSource.getRepository(CompanyOrmEntity).create({
      id: userId,
      cnpj: e.cnpj,
      name: e.name,
      responsibleName: e.responsibleName,
      contact: contact,
    });
    await appDataSource.getRepository(CompanyOrmEntity).save(company);
    empresas.push(company);
  }
  logger.info('3 empresas criadas.');

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
    const curso = appDataSource.getRepository(CourseOrmEntity).create({
      id: uuidv4(),
      ...c,
    });
    await appDataSource.getRepository(CourseOrmEntity).save(curso);
    cursos.push(curso);
  }
  logger.info('5 cursos criados.');

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
      HowHeardChannel.REFEREE,
      HowHeardChannel.LINKEDIN,
      HowHeardChannel.OTHERS,
    ][index % 4],
  }));

  const alunos: StudentOrmEntity[] = [];
  for (let i = 0; i < normalizedAlunosData.length; i++) {
    const a = normalizedAlunosData[i];
    const userId = uuidv4();
    const numero = String(i + 1).padStart(2, '0');
    const user = appDataSource.getRepository(UserOrmEntity).create({
      id: userId,
      email: `aluno${numero}@fatilab.com`,
      password: senhaAluno,
      role: UserRoleEnum.STUDENT,
    });
    await appDataSource.getRepository(UserOrmEntity).save(user);
    const contact = appDataSource.getRepository(ContactOrmEntity).create({
      id: userId,
      phone: `(51) 90000-${numero}00`,
      city: a.city,
      state: a.state,
    });
    await appDataSource.getRepository(ContactOrmEntity).save(contact);
    const student = appDataSource.getRepository(StudentOrmEntity).create({
      id: userId,
      contact: contact,
      cpf: `${100000000 + i * 11111111}`.slice(0, 11),
      birthDate: new Date(a.birthDate),
      education: a.education,
      gender: a.gender,
      race: a.race,
      activityArea: a.area,
      hasProgrammingExperience: i % 2 === 0,
      familyIncome: FamilyIncome.BETWEEN_1_3,
      hasComputer: true,
      hasInternet: true,
      committedToParticipate: true,
      motivation: `Quero desenvolver habilidades em ${a.area} para ingressar no mercado de trabalho.`,
      howHeard: a.howHeard,
    });
    await appDataSource.getRepository(StudentOrmEntity).save(student);

    const disability = appDataSource.getRepository(DisabilityOrmEntity).create({
      studentId: userId,
      hasDisability: a.hasDisability,
      type: a.hasDisability ? a.disability : null,
    });
    await appDataSource.getRepository(DisabilityOrmEntity).save(disability);

    if (i % 3 === 0) {
      const benefit = appDataSource
        .getRepository(SocialBenefitOrmEntity)
        .create({
          student: student,
          benefit: [
            SocialBenefitType.BOLSA_FAMILIA,
            SocialBenefitType.BPC,
            SocialBenefitType.OTHERS,
          ][i % 3],
        });
      await appDataSource.getRepository(SocialBenefitOrmEntity).save(benefit);
    }
    alunos.push(student);
  }
  logger.info('15 alunos criados.');

  // CURSOS PRESENCIAIS
  const cursosPresenciais = [cursos[0], cursos[1]];
  for (let pc = 0; pc < cursosPresenciais.length; pc++) {
    const personCourse = appDataSource
      .getRepository(InPersonCourseDetailOrmEntity)
      .create({
        id: uuidv4(),
        course: cursosPresenciais[pc],
        address: ['Porto Alegre', 'Canoas'][pc],
        startDate: cursosPresenciais[pc].startDate,
        shift: ['manha', 'tarde'][pc],
        room: `Sala ${pc + 1}`,
        vacancies: 30,
      });
    await appDataSource
      .getRepository(InPersonCourseDetailOrmEntity)
      .save(personCourse);
  }
  logger.info('2 cursos presenciais criados.');

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
    const skill = appDataSource.getRepository(SkillOrmEntity).create({
      id: uuidv4(),
      name,
    });
    await appDataSource.getRepository(SkillOrmEntity).save(skill);
    skills.push(skill);
  }
  logger.info('Skills criadas.');

  // 6. CURRÍCULOS (2)
  const curriculoAlunos = [alunos[0], alunos[1]];
  for (let i = 0; i < curriculoAlunos.length; i++) {
    const aluno = curriculoAlunos[i];
    const curriculo = appDataSource.getRepository(CurriculumOrmEntity).create({
      id: uuidv4(),
      student: aluno,
      isAvailable: true,
      about: `Profissional em formação com interesse em tecnologia.`,
      linkedin: `https://linkedin.com/in/aluno0${i + 1}`,
      github: `https://github.com/aluno0${i + 1}`,
      videoPresentation: `https://fatilab.com/videos/aluno0${i + 1}`,
    });
    await appDataSource.getRepository(CurriculumOrmEntity).save(curriculo);
    for (let j = 0; j < 3; j++) {
      const sc = appDataSource.getRepository(CurriculumSkillOrmEntity).create({
        curriculumId: curriculo.id,
        skillId: skills[j + i * 3].id,
      });
      await appDataSource.getRepository(CurriculumSkillOrmEntity).save(sc);
    }
  }
  logger.info('2 currículos com skills criados.');

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
    const job = appDataSource.getRepository(JobOpeningOrmEntity).create({
      name: v.name,
      description: v.description,
      openingsCount: v.openingsCount,
      isPcd: v.isPcd,
      company: v.company,
    });
    await appDataSource.getRepository(JobOpeningOrmEntity).save(job);
    for (let j = 0; j < 2; j++) {
      const sj = appDataSource.getRepository(JobSkillOrmEntity).create({
        jobId: job.id,
        skillId: skills[(i + j) % skills.length].id,
      });
      await appDataSource.getRepository(JobSkillOrmEntity).save(sj);
    }
  }
  logger.info('5 vagas com skills criadas.');
  logger.info('\nResumo do dataset gerado:');
  logger.info('- 1 admin');
  logger.info('- 3 empresas');
  logger.info('- 5 cursos');
  logger.info('- 2 cursos presenciais');
  logger.info('- 15 alunos');
  logger.info('- 10 skills');
  logger.info('- 2 curriculos');
  logger.info('- 5 vagas');
  logger.info('- 1 configuração de WhatsApp');
  logger.info('\nExemplos reais do seed:');
  logger.info('- Admin: admin@fatilab.com | senha: Admin@123 | role: ADMIN');
  logger.info(
    '- Empresa: tech@innovatech.com | InnovaTech Solucoes | CNPJ: 12.345.678/0001-99',
  );
  logger.info(
    '- Empresa: rh@solucoesdigitais.com | Solucoes Digitais Ltda | CNPJ: 98.765.432/0001-11',
  );
  logger.info(
    '- Curso: Desenvolvimento Web Full Stack | carga: 120h | inicio: 2025-02-01',
  );
  logger.info(
    '- Curso: Ciencia de Dados com Python | carga: 80h | inicio: 2025-03-01',
  );
  logger.info(
    '- Aluno: aluno01@fatilab.com | Ana Beatriz Costa | area: design',
  );
  logger.info(
    '- Aluno: aluno02@fatilab.com | Bruno Ferreira | area: desenvolvimento',
  );
  logger.info(
    '- Vaga: Desenvolvedor Frontend | empresa: InnovaTech Solucoes | vagas: 2 | PCD: sim',
  );
  logger.info(
    '- Vaga: Engenheiro DevOps | empresa: Solucoes Digitais Ltda | vagas: 1 | PCD: nao',
  );
  logger.info(
    '- Skills de exemplo: JavaScript, TypeScript, Python, React, Node.js, SQL',
  );

  logger.info('\nSeed concluído com sucesso!');
  await appDataSource.destroy();
}

function isSeedEntrypoint(): boolean {
  const entryFile = process.argv[1] ?? '';

  return /(?:^|[\\/])seed\.(ts|js)$/.test(entryFile);
}

if (isSeedEntrypoint()) {
  void seed().catch((err) => {
    logger.critical('Erro no seed', err);
    process.exit(1);
  });
}
