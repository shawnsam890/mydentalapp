import { createServer } from './server';

const port = process.env.PORT || 4000;

async function main() {
  const app = await createServer();
  app.listen(port, () => {
    console.log(`Dental clinic API listening on port ${port}`);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
