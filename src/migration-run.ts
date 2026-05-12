import { AppDataSource } from "./data-source";

async function run() {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  await AppDataSource.destroy();
}

run();