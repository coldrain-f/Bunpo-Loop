# JLPT Default Data

This directory is bundled into the Docker image and imported once into a fresh
SQLite database.

- `grammar-csv`: first-pass grammar pattern decks.
- `example-csv`: second-pass example sentence decks.

Set `BUNPO_LOOP_SEED_DEFAULT_DATA=0` to start from a blank database.
