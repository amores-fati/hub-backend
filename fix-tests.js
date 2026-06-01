const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'test', 'integration');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

const replacements = {
  "'ADMIN'": "'ADMINISTRADOR'",
  "'STUDENT'": "'ESTUDANTE'",
  "'COMPANY'": "'EMPRESA'",
  "'MALE'": "'MASCULINO'",
  "'FEMALE'": "'FEMININO'",
  "'WHITE'": "'BRANCO'",
  "'PRIMARY'": "'FUNDAMENTAL'",
  "'SECONDARY'": "'MEDIO'",
  "'NO_EDUCATION'": "'SEM_ESCOLARIDADE'",
  "'HIGHER'": "'SUPERIOR'",
  "'POSTGRADUATE'": "'POS_GRADUACAO'"
};

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  Object.entries(replacements).forEach(([key, val]) => {
    // We only want to replace standalone strings
    // For example [adminId, email, hash, 'ADMIN']
    const regex = new RegExp(key, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, val);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Updated ' + file);
  }
});
