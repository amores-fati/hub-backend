import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { buildDatabaseOptions } from '../../../config/database.config';

import { UserRoleEnum } from '../../../core/domain/enums/user-role.enum';
import { AmoresFatiLogger } from '../../../utils/logger';
import { AdminOrmEntity } from '../orm/admin.orm-entity';
import { CourseOrmEntity } from '../orm/course.orm-entity';
import { DisabilityOrmEntity } from '../orm/disability.orm-entity';
import { SettingOrmEntity } from '../orm/setting.orm-entity';
import { SkillOrmEntity } from '../orm/skill.orm-entity';
import { SocialBenefitOrmEntity } from '../orm/social-benefit.orm-entity';
import { UserOrmEntity } from '../orm/user.orm-entity';

dotenv.config({ quiet: true });

const logger = new AmoresFatiLogger().setContext('SeedProduction');

const shouldReset = process.argv.includes('--reset');

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Variavel de ambiente "${name}" e obrigatoria para o seed de producao.`,
    );
  }
  return value.trim();
}

async function ensureSeedMode(appDataSource: DataSource): Promise<boolean> {
  const userCount = await appDataSource.getRepository(UserOrmEntity).count();

  if (!shouldReset && userCount > 0) {
    logger.info(
      'Seed cancelado: o banco ja possui dados. Use "npm run seed:prod:reset" para recriar tudo.',
    );
    return false;
  }

  if (shouldReset) {
    await appDataSource.query(`TRUNCATE TABLE
      job_skills, curriculum_skills, skills, job_openings, curriculum,
      courses, disability, student_disability,
      social_benefit, student_social_benefit, telephone_student,
      telephone_company, address_student, address_company,
      students, admins, companies, users, settings
      RESTART IDENTITY CASCADE`);
    logger.info('Dados anteriores removidos.');
  } else {
    logger.info(
      'Banco vazio detectado. Seed inicial sera executado sem reset.',
    );
  }

  return true;
}

export async function seedProduction(): Promise<void> {
  const adminEmail = readRequiredEnv('PROD_ADMIN_EMAIL').toLowerCase();
  const adminPassword = readRequiredEnv('PROD_ADMIN_PASSWORD');

  const appDataSource = new DataSource(buildDatabaseOptions());
  await appDataSource.initialize();
  logger.info(' Conectado ao banco de dados.');

  const shouldContinue = await ensureSeedMode(appDataSource);

  if (!shouldContinue) {
    await appDataSource.destroy();
    return;
  }

  const SALT = 10;
  const senhaAdmin = await bcrypt.hash(adminPassword, SALT);

  // 1. ADMIN (credenciais vêm exclusivamente das variáveis de ambiente)
  const adminUserId = uuidv4();
  const adminUser = appDataSource.getRepository(UserOrmEntity).create({
    id: adminUserId,
    email: adminEmail,
    password: senhaAdmin,
    role: UserRoleEnum.ADMIN,
  });
  await appDataSource.getRepository(UserOrmEntity).save(adminUser);
  const admin = appDataSource.getRepository(AdminOrmEntity).create({
    id: adminUserId,
  });
  await appDataSource.getRepository(AdminOrmEntity).save(admin);
  logger.info(`Admin criado: ${adminEmail}`);

  // 2. CONFIGURAÇÕES GERAIS
  const whatsappSetting = appDataSource.getRepository(SettingOrmEntity).create({
    id: uuidv4(),
    key: 'whatsapp_phone',
    value: '555192669381',
  });
  await appDataSource.getRepository(SettingOrmEntity).save(whatsappSetting);
  logger.info('Configuração de WhatsApp seedada.');

  // 3. DADOS DE REFERÊNCIA (não são mock — o app depende deles)
  // 3.1 Catálogo de skills (top ~100 tecnologias). É um catálogo FECHADO:
  // tanto a tela de vagas (por id, via GET /skills) quanto o currículo do aluno
  // apenas SELECIONAM desta lista. O app NÃO cria skills novas, então a lista
  // precisa existir previamente no banco.
  const skillNames = [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'C',
    'C++',
    'C#',
    'Go',
    'Rust',
    'Ruby',
    'PHP',
    'Kotlin',
    'Swift',
    'Scala',
    'R',
    'Dart',
    'Elixir',
    'Perl',
    'Objective-C',
    'SQL',
    'HTML',
    'CSS',
    'Sass',
    'Bash',
    'PowerShell',
    'React',
    'Angular',
    'Vue.js',
    'Next.js',
    'Nuxt.js',
    'Svelte',
    'Redux',
    'jQuery',
    'Tailwind CSS',
    'Bootstrap',
    'Material UI',
    'Webpack',
    'Vite',
    'Node.js',
    'Express',
    'NestJS',
    'Spring Boot',
    'Django',
    'Flask',
    'FastAPI',
    'Laravel',
    'Ruby on Rails',
    'ASP.NET Core',
    'GraphQL',
    'REST APIs',
    'gRPC',
    'React Native',
    'Flutter',
    'Android',
    'iOS',
    'SwiftUI',
    'Jetpack Compose',
    'PostgreSQL',
    'MySQL',
    'SQLite',
    'MongoDB',
    'Redis',
    'MariaDB',
    'Oracle Database',
    'SQL Server',
    'Cassandra',
    'DynamoDB',
    'Elasticsearch',
    'Firebase',
    'AWS',
    'Azure',
    'Google Cloud Platform',
    'Docker',
    'Kubernetes',
    'Terraform',
    'Ansible',
    'Jenkins',
    'GitHub Actions',
    'GitLab CI',
    'CI/CD',
    'Nginx',
    'Linux',
    'Prometheus',
    'Grafana',
    'Git',
    'RabbitMQ',
    'Apache Kafka',
    'Microservices',
    'Pandas',
    'NumPy',
    'TensorFlow',
    'PyTorch',
    'scikit-learn',
    'Apache Spark',
    'Power BI',
    'Tableau',
    'Excel',
    'Jupyter',
    'Figma',
    'Jest',
  ];
  for (const name of skillNames) {
    const skill = appDataSource.getRepository(SkillOrmEntity).create({
      id: uuidv4(),
      name,
    });
    await appDataSource.getRepository(SkillOrmEntity).save(skill);
  }
  logger.info(`${skillNames.length} skills de referência criadas.`);

  // 3.2 Deficiências (taxonomia canônica). O frontend usa opções fixas no
  // código e o cadastro cria por nome sob demanda; pré-criar a lista canônica
  // mantém a nomenclatura consistente e evita linhas duplicadas.
  const disabilityTypes = [
    'VISUAL',
    'AUDITIVA',
    'FISICA',
    'INTELECTUAL',
    'PSICOSSOCIAL',
    'MULTIPLA',
    'TEA',
    'OUTRA',
    'NENHUMA',
  ];
  for (const type of disabilityTypes) {
    const disability = appDataSource.getRepository(DisabilityOrmEntity).create({
      id: uuidv4(),
      name: type,
    });
    await appDataSource.getRepository(DisabilityOrmEntity).save(disability);
  }
  logger.info(`${disabilityTypes.length} deficiências de referência criadas.`);

  // 3.3 Benefícios sociais (taxonomia canônica), mesma lógica das deficiências.
  const benefitTypes = ['BOLSA FAMILIA', 'BPC', 'OUTROS'];
  for (const type of benefitTypes) {
    const benefit = appDataSource.getRepository(SocialBenefitOrmEntity).create({
      id: uuidv4(),
      name: type,
    });
    await appDataSource.getRepository(SocialBenefitOrmEntity).save(benefit);
  }
  logger.info(`${benefitTypes.length} benefícios sociais de referência criados.`);

  // 4. CURSOS REAIS
  const cursosData = [
    {
      name: 'Curso de Programação Online',
      banner:
        'https://static.wixstatic.com/media/cca81f_2df90b312b0a42fa87083d7a6ad190a7~mv2.png/v1/fill/w_933,h_400,al_c,q_90,enc_avif,quality_auto/cca81f_2df90b312b0a42fa87083d7a6ad190a7~mv2.png',
      description:
        'Curso de Programação 100% online e gratuito. Para todos os públicos, sem pré-requisitos: o único requisito é querer aprender a programar. Aulas de maio a agosto, com certificado emitido pelo Instituto Amores Fati em parceria com FIAP + Alura.',
      courseLoad: '80h',
      startDate: new Date('2026-05-05'),
      endDate: new Date('2026-08-31'),
      startRegistrations: new Date('2026-04-01'),
      endRegistrations: new Date('2026-05-05'),
      linkAccess: 'https://www.amoresfati.org.br/',
      modality: 'ONLINE',
      vacancyCount: 100,
    },
    {
      name: 'Curso de Programação Presencial',
      banner:
        'https://static.wixstatic.com/media/cca81f_0f46bbf3d18c417baccced47010dea1f~mv2.png/v1/fill/w_933,h_400,al_c,q_90,enc_avif,quality_auto/cca81f_0f46bbf3d18c417baccced47010dea1f~mv2.png',
      description:
        'Curso de Programação Presencial e gratuito, voltado a jovens com deficiência física ou neurodivergentes de 14 a 29 anos. Aulas de maio a agosto, às terças e quintas, em turmas de manhã ou tarde, no Instituto Caldeira em Porto Alegre. Certificado emitido pelo Instituto Amores Fati em parceria com AldeIA, Alura+Língua, FIAP+Alura e Tramontina.',
      courseLoad: '120h',
      startDate: new Date('2026-05-05'),
      endDate: new Date('2026-08-31'),
      startRegistrations: new Date('2026-04-01'),
      endRegistrations: new Date('2026-05-03'),
      linkAccess: 'https://www.amoresfati.org.br/',
      modality: 'PRESENCIAL',
      vacancyCount: 30,
      shift: 'morning',
      address: 'Instituto Caldeira - Porto Alegre/RS',
    },
  ];

  for (const c of cursosData) {
    const curso = appDataSource.getRepository(CourseOrmEntity).create({
      id: uuidv4(),
      ...c,
    });
    await appDataSource.getRepository(CourseOrmEntity).save(curso);
  }
  logger.info(`${cursosData.length} cursos reais criados.`);

  logger.info('\nResumo do dataset gerado:');
  logger.info('- 1 admin');
  logger.info('- 1 configuração de WhatsApp');
  logger.info(`- ${skillNames.length} skills de referência`);
  logger.info(`- ${disabilityTypes.length} deficiências de referência`);
  logger.info(`- ${benefitTypes.length} benefícios sociais de referência`);
  logger.info(`- ${cursosData.length} cursos reais`);
  logger.info(`- Admin: ${adminEmail} | role: ADMIN`);

  logger.info('\nSeed de producao concluido com sucesso!');
  await appDataSource.destroy();
}

function isSeedEntrypoint(): boolean {
  const entryFile = process.argv[1] ?? '';
  return /(?:^|[\\/])seed-production\.(ts|js)$/.test(entryFile);
}

if (isSeedEntrypoint()) {
  void seedProduction().catch((err: unknown) => {
    logger.critical(
      'Erro no seed de producao',
      err instanceof Error ? err : new Error(String(err)),
    );
    process.exit(1);
  });
}
