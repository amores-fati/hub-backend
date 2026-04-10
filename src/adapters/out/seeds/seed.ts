import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

import { UserOrmEntity } from '../user/user.orm-entity';
import { AdminOrmEntity } from '../admin/admin.orm-entity';
import { ContactOrmEntity } from '../contact/contact.orm-entity';
import { EnterpriseOrmEntity } from '../enterprise/enterprise.orm-entity';
import { StudentOrmEntity } from '../student/student.orm-entity';
import { AccessibilityResourceOrmEntity } from '../accessibility_resources/accessibility_resourses.orm-entity';
import { SocialBenefitOrmEntity } from '../social_benefits/social_benefits';
import { DisabilityOrmEntity } from '../disability/disability.orm-entity';
import { CourseOrmEntity } from '../course/course.orm-entity';
import { PersonCourseOrmEntity } from '../person_course/person_course.orm-entity';
import { SkillOrmEntity } from '../skill/skill.orm-entity';
import { CurriculumOrmEntity } from '../curriculum/curriculum.orm-entity';
import { SkillsCurriculumOrmEntity } from '../skills_curriculum/skills_curriculum.orm-entity';
import { JobOrmEntity } from '../jobs/jobs.orm-entity';
import { SkillsJobOrmEntity } from '../skills_job/skills_job.orm-entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [
    UserOrmEntity,
    AdminOrmEntity,
    ContactOrmEntity,
    EnterpriseOrmEntity,
    StudentOrmEntity,
    AccessibilityResourceOrmEntity,
    SocialBenefitOrmEntity,
    DisabilityOrmEntity,
    CourseOrmEntity,
    PersonCourseOrmEntity,
    SkillOrmEntity,
    CurriculumOrmEntity,
    SkillsCurriculumOrmEntity,
    JobOrmEntity,
    SkillsJobOrmEntity,
  ],
  synchronize: false,
});

// ─── Credenciais documentadas ────────────────────────────────────────────────
// Admin:        email: admin@fatilab.com         | senha: Admin@123
// Empresa 1:    email: tech@innovatech.com       | senha: Empresa@123
// Empresa 2:    email: rh@solucoesdigitais.com   | senha: Empresa@123
// Empresa 3:    email: vagas@nextera.com         | senha: Empresa@123
// Alunos:       email: aluno01~15@fatilab.com    | senha: Aluno@123
// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  await AppDataSource.initialize();
  console.log(' Conectado ao banco de dados.');

  await AppDataSource.query(`TRUNCATE TABLE
    skills_job, skills_curriculum, jobs, curriculums,
    person_courses, courses, disabilities,
    social_benefits, accessibility_resources,
    students, admins, enterprises, contacts, users
    RESTART IDENTITY CASCADE`);
  console.log('Dados anteriores removidos.');

  const SALT = 10;
  const senhaAdmin   = await bcrypt.hash('Admin@123',   SALT);
  const senhaEmpresa = await bcrypt.hash('Empresa@123', SALT);
  const senhaAluno   = await bcrypt.hash('Aluno@123',   SALT);

  // ══════════════════════════════════════════════════════════════════════════
  // 1. ADMIN
  // ══════════════════════════════════════════════════════════════════════════
  const adminUserId = uuidv4();

  const adminUser = AppDataSource.getRepository(UserOrmEntity).create({
    id: adminUserId,
    email: 'admin@fatilab.com',
    password: senhaAdmin,
    role: 'admin',
  });
  await AppDataSource.getRepository(UserOrmEntity).save(adminUser);

  const admin = AppDataSource.getRepository(AdminOrmEntity).create({
    id: adminUserId,
  });
  await AppDataSource.getRepository(AdminOrmEntity).save(admin);

  console.log('Admin criado.');

  // ══════════════════════════════════════════════════════════════════════════
  // 2. EMPRESAS
  // ══════════════════════════════════════════════════════════════════════════
  const empresasData = [
    {
      email: 'tech@innovatech.com',
      cnpj: '12.345.678/0001-99',
      responsible: 'Carlos Mendes',
      name: 'InnovaTech Soluções',
      phone: '(51) 99111-2222',
      city: 'Porto Alegre',
      state: 'RS',
    },
    {
      email: 'rh@solucoesdigitais.com',
      cnpj: '98.765.432/0001-11',
      responsible: 'Fernanda Lima',
      name: 'Soluções Digitais Ltda',
      phone: '(51) 98222-3333',
      city: 'Canoas',
      state: 'RS',
    },
    {
      email: 'vagas@nextera.com',
      cnpj: '45.678.901/0001-55',
      responsible: 'Rafael Souza',
      name: 'Nextera Tecnologia',
      phone: '(51) 97333-4444',
      city: 'São Leopoldo',
      state: 'RS',
    },
  ];

  const empresas: EnterpriseOrmEntity[] = [];

  for (const e of empresasData) {
    const userId = uuidv4();

    const user = AppDataSource.getRepository(UserOrmEntity).create({
      id: userId,
      email: e.email,
      password: senhaEmpresa,
      role: 'enterprise',
    });
    await AppDataSource.getRepository(UserOrmEntity).save(user);

    const contact = AppDataSource.getRepository(ContactOrmEntity).create({
      id: userId,
      name: e.name,
      phone: e.phone,
      city: e.city,
      state: e.state,
      country: 'Brasil',
    });
    await AppDataSource.getRepository(ContactOrmEntity).save(contact);

    const enterprise = AppDataSource.getRepository(EnterpriseOrmEntity).create({
      id: userId,
      cnpj: e.cnpj,
      responsible: e.responsible,
    });
    await AppDataSource.getRepository(EnterpriseOrmEntity).save(enterprise);
    empresas.push(enterprise);
  }

  console.log('3 empresas criadas.');

  // ══════════════════════════════════════════════════════════════════════════
  // 3. CURSOS
  // ══════════════════════════════════════════════════════════════════════════
  const cursosData = [
    {
      name: 'Desenvolvimento Web Full Stack',
      banner: 'https://fatilab.com/banners/web.jpg',
      description: 'Curso completo de desenvolvimento web com React e Node.js.',
      course_load: '120h',
      start_date: new Date('2025-02-01'),
      end_date: new Date('2025-06-30'),
      start_registrations: new Date('2025-01-01'),
      end_registrations: new Date('2025-01-28'),
      link_access: 'https://fatilab.com/cursos/web',
    },
    {
      name: 'Ciência de Dados com Python',
      banner: 'https://fatilab.com/banners/data.jpg',
      description: 'Introdução à análise de dados, pandas e machine learning.',
      course_load: '80h',
      start_date: new Date('2025-03-01'),
      end_date: new Date('2025-05-31'),
      start_registrations: new Date('2025-02-01'),
      end_registrations: new Date('2025-02-25'),
      link_access: 'https://fatilab.com/cursos/data',
    },
    {
      name: 'UX/UI Design',
      banner: 'https://fatilab.com/banners/ux.jpg',
      description: 'Design de interfaces e experiência do usuário com Figma.',
      course_load: '60h',
      start_date: new Date('2025-04-01'),
      end_date: new Date('2025-05-31'),
      start_registrations: new Date('2025-03-01'),
      end_registrations: new Date('2025-03-28'),
      link_access: 'https://fatilab.com/cursos/ux',
    },
    {
      name: 'Infraestrutura e DevOps',
      banner: 'https://fatilab.com/banners/devops.jpg',
      description: 'Docker, Kubernetes, CI/CD e cloud na prática.',
      course_load: '100h',
      start_date: new Date('2025-05-01'),
      end_date: new Date('2025-08-31'),
      start_registrations: new Date('2025-04-01'),
      end_registrations: new Date('2025-04-28'),
      link_access: 'https://fatilab.com/cursos/devops',
    },
    {
      name: 'Introdução à Programação',
      banner: 'https://fatilab.com/banners/intro.jpg',
      description: 'Lógica de programação e primeiros passos com JavaScript.',
      course_load: '40h',
      start_date: new Date('2025-01-15'),
      end_date: new Date('2025-02-28'),
      start_registrations: new Date('2025-01-01'),
      end_registrations: new Date('2025-01-12'),
      link_access: 'https://fatilab.com/cursos/intro',
    },
  ];

  const cursos: CourseOrmEntity[] = [];
  for (const c of cursosData) {
    const curso = AppDataSource.getRepository(CourseOrmEntity).create({ id: uuidv4(), ...c });
    await AppDataSource.getRepository(CourseOrmEntity).save(curso);
    cursos.push(curso);
  }

  console.log(' 5 cursos criados.');

  // ══════════════════════════════════════════════════════════════════════════
  // 4. ALUNOS (15)
  // ══════════════════════════════════════════════════════════════════════════
  const alunosData = [
    { name: 'Ana Beatriz Costa',   city: 'Porto Alegre',  state: 'RS', education: 'ensino_medio',  disability: 'visual',       has_disability: true,  gender: 'feminino',    color: 'parda',   area: 'design' },
    { name: 'Bruno Ferreira',      city: 'Canoas',        state: 'RS', education: 'superior',      disability: 'auditiva',     has_disability: true,  gender: 'masculino',   color: 'branca',  area: 'desenvolvimento' },
    { name: 'Carla Souza',         city: 'Gravataí',      state: 'RS', education: 'tecnico',       disability: 'fisica',       has_disability: true,  gender: 'feminino',    color: 'preta',   area: 'dados' },
    { name: 'Diego Almeida',       city: 'Novo Hamburgo', state: 'RS', education: 'ensino_medio',  disability: 'intelectual',  has_disability: true,  gender: 'masculino',   color: 'parda',   area: 'infraestrutura' },
    { name: 'Elisa Mendes',        city: 'São Leopoldo',  state: 'RS', education: 'superior',      disability: 'psicossocial', has_disability: true,  gender: 'feminino',    color: 'amarela', area: 'design' },
    { name: 'Felipe Rodrigues',    city: 'Pelotas',       state: 'RS', education: 'pos_graduacao', disability: 'multipla',     has_disability: true,  gender: 'masculino',   color: 'branca',  area: 'gestao' },
    { name: 'Gabriela Nunes',      city: 'Santa Maria',   state: 'RS', education: 'tecnico',       disability: 'TEA',          has_disability: true,  gender: 'feminino',    color: 'preta',   area: 'desenvolvimento' },
    { name: 'Henrique Oliveira',   city: 'Porto Alegre',  state: 'RS', education: 'ensino_medio',  disability: 'outra',        has_disability: true,  gender: 'masculino',   color: 'parda',   area: 'dados' },
    { name: 'Isabela Lima',        city: 'Caxias do Sul', state: 'RS', education: 'superior',      disability: 'nenhuma',      has_disability: false, gender: 'feminino',    color: 'branca',  area: 'design' },
    { name: 'João Pedro Santos',   city: 'Porto Alegre',  state: 'RS', education: 'tecnico',       disability: 'nenhuma',      has_disability: false, gender: 'masculino',   color: 'preta',   area: 'infraestrutura' },
    { name: 'Karen Vieira',        city: 'Viamão',        state: 'RS', education: 'ensino_medio',  disability: 'visual',       has_disability: true,  gender: 'não_binário', color: 'parda',   area: 'desenvolvimento' },
    { name: 'Lucas Martins',       city: 'Alvorada',      state: 'RS', education: 'pos_graduacao', disability: 'auditiva',     has_disability: true,  gender: 'masculino',   color: 'branca',  area: 'dados' },
    { name: 'Mariana Pereira',     city: 'Porto Alegre',  state: 'RS', education: 'superior',      disability: 'fisica',       has_disability: true,  gender: 'feminino',    color: 'parda',   area: 'gestao' },
    { name: 'Nicolas Carvalho',    city: 'Esteio',        state: 'RS', education: 'ensino_medio',  disability: 'nenhuma',      has_disability: false, gender: 'masculino',   color: 'preta',   area: 'design' },
    { name: 'Olivia Ferreira',     city: 'Porto Alegre',  state: 'RS', education: 'tecnico',       disability: 'psicossocial', has_disability: true,  gender: 'feminino',    color: 'amarela', area: 'desenvolvimento' },
  ];

  const alunos: StudentOrmEntity[] = [];

  for (let i = 0; i < alunosData.length; i++) {
    const a = alunosData[i];
    const userId = uuidv4();
    const numero = String(i + 1).padStart(2, '0');

    const user = AppDataSource.getRepository(UserOrmEntity).create({
      id: userId,
      email: `aluno${numero}@fatilab.com`,
      password: senhaAluno,
      role: 'student',
    });
    await AppDataSource.getRepository(UserOrmEntity).save(user);

    const contact = AppDataSource.getRepository(ContactOrmEntity).create({
      id: userId,
      name: a.name,
      city: a.city,
      state: a.state,
      country: 'Brasil',
    });
    await AppDataSource.getRepository(ContactOrmEntity).save(contact);

    const student = AppDataSource.getRepository(StudentOrmEntity).create({
      id: userId,
      cpf: `${100000000 + i * 11111111}`.slice(0, 11),
      education: a.education,
      gender: a.gender,
      color: a.color,
      area_activity: a.area,
      programming_exp: i % 2 === 0,
      tecnology_course: i % 3 !== 0,
      has_computer: true,
      has_internet: true,
      compromisse: true,
      send_curriculum: i % 2 === 0,
      motivation: `Quero desenvolver habilidades em ${a.area} para ingressar no mercado de trabalho.`,
      how_know: ['instagram', 'indicacao', 'google', 'evento'][i % 4],
    });
    await AppDataSource.getRepository(StudentOrmEntity).save(student);

    // Deficiência
    const disability = new DisabilityOrmEntity();
    disability.studentId = userId;
    disability.hasDisability = a.has_disability;
    disability.description = a.has_disability ? a.disability : null;
    disability.hasReport = a.has_disability ? 'sim' : null;
    await AppDataSource.getRepository(DisabilityOrmEntity).save(disability);

    // Benefício social (alguns alunos)
    if (i % 3 === 0) {
      const benefit = AppDataSource.getRepository(SocialBenefitOrmEntity).create({
        student_id: userId,
        benefit: ['bolsa_familia', 'bpc', 'auxilio_brasil'][i % 3],
      });
      await AppDataSource.getRepository(SocialBenefitOrmEntity).save(benefit);
    }

    // Recurso de acessibilidade (alunos com deficiência)
    if (a.has_disability) {
      const resource = AppDataSource.getRepository(AccessibilityResourceOrmEntity).create({
        student_id: userId,
        resource: a.disability,
      });
      await AppDataSource.getRepository(AccessibilityResourceOrmEntity).save(resource);
    }

    alunos.push(student);
  }

  console.log(' 15 alunos criados.');

  // ══════════════════════════════════════════════════════════════════════════
  // CURSOS PRESENCIAIS (fora do loop de alunos)
  // ══════════════════════════════════════════════════════════════════════════
  const cursosPresenciais = [cursos[0], cursos[1]];

  for (let pc = 0; pc < cursosPresenciais.length; pc++) {
    const personCourse = AppDataSource.getRepository(PersonCourseOrmEntity).create({
      id: uuidv4(),
      course: cursosPresenciais[pc],
      adress: ['Porto Alegre', 'Canoas'][pc],
      start_date: cursosPresenciais[pc].start_date,
      shift: ['manha', 'tarde'][pc],
      room: `Sala ${pc + 1}`,
      vacancies: 30,
    });
    await AppDataSource.getRepository(PersonCourseOrmEntity).save(personCourse);
  }

  console.log('✅ 2 cursos presenciais criados.');

  // ══════════════════════════════════════════════════════════════════════════
  // 5. SKILLS
  // ══════════════════════════════════════════════════════════════════════════
  const skillNames = ['JavaScript', 'TypeScript', 'Python', 'React', 'Node.js', 'SQL', 'Figma', 'Docker', 'Git', 'Excel'];
  const skills: SkillOrmEntity[] = [];

  for (const name of skillNames) {
    const skill = AppDataSource.getRepository(SkillOrmEntity).create({ id: uuidv4(), name });
    await AppDataSource.getRepository(SkillOrmEntity).save(skill);
    skills.push(skill);
  }

  console.log(' Skills criadas.');

  // ══════════════════════════════════════════════════════════════════════════
  // 6. CURRÍCULOS (2)
  // ══════════════════════════════════════════════════════════════════════════
  const curriculoAlunos = [alunos[0], alunos[1]];

  for (let i = 0; i < curriculoAlunos.length; i++) {
    const aluno = curriculoAlunos[i];

    const curriculo = new CurriculumOrmEntity();
    curriculo.id = uuidv4();
    curriculo.student_id = aluno;
    curriculo.is_avaliable = true;
    curriculo.about = `Profissional em formação com interesse em tecnologia.`;
    curriculo.linkedin = `https://linkedin.com/in/aluno0${i + 1}`;
    curriculo.github = `https://github.com/aluno0${i + 1}`;
    curriculo.video_apresentation = `https://fatilab.com/videos/aluno0${i + 1}`;
    await AppDataSource.getRepository(CurriculumOrmEntity).save(curriculo);

    // 3 skills por currículo
    for (let j = 0; j < 3; j++) {
      const sc = new SkillsCurriculumOrmEntity();
      sc.curriculum_id = curriculo.id;
      sc.skill_id = skills[j + i * 3].id;
      await AppDataSource.getRepository(SkillsCurriculumOrmEntity).save(sc);
    }
  }

  console.log(' 2 currículos com skills criados.');

  // ══════════════════════════════════════════════════════════════════════════
  // 7. VAGAS (5)
  // ══════════════════════════════════════════════════════════════════════════
  const vagasData = [
    { name: 'Desenvolvedor Frontend',   description: 'Vaga para dev React.',      jobs_number: 2, pcd: true,  empresa: empresas[0] },
    { name: 'Analista de Dados',        description: 'Python e SQL obrigatório.',  jobs_number: 1, pcd: false, empresa: empresas[0] },
    { name: 'Designer UX/UI',           description: 'Figma e pesquisa de UX.',    jobs_number: 3, pcd: true,  empresa: empresas[1] },
    { name: 'Engenheiro DevOps',        description: 'Docker, K8s e AWS.',         jobs_number: 1, pcd: false, empresa: empresas[1] },
    { name: 'Desenvolvedor Full Stack', description: 'Node.js + React.',            jobs_number: 2, pcd: true,  empresa: empresas[2] },
  ];

  for (let i = 0; i < vagasData.length; i++) {
    const v = vagasData[i];

    const job = new JobOrmEntity();
    job.name = v.name;
    job.description = v.description;
    job.jobs_number = v.jobs_number;
    job.pcd = v.pcd;
    job.enterprise = v.empresa;
    await AppDataSource.getRepository(JobOrmEntity).save(job);

    // 2 skills por vaga
    for (let j = 0; j < 2; j++) {
      const sj = new SkillsJobOrmEntity();
      sj.job_id = job.id;
      sj.skill_id = skills[(i + j) % skills.length].id;
      await AppDataSource.getRepository(SkillsJobOrmEntity).save(sj);
    }
  }

  console.log(' 5 vagas com skills criadas.');

  console.log('\n Seed concluído com sucesso!');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});