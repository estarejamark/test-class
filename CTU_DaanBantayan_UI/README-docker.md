# Docker Usage for CTU Daan Bantayan UI

## Build the Docker image

```bash
# From the project root
# Replace <tag> with your preferred image name
docker build -t ctu-frontend:latest .
```

## Run the container

```bash
docker run -p 3000:3000 ctu-frontend:latest
```

## Notes

- The app will be available at http://localhost:3000
- You can pass environment variables with `-e VAR=value` if needed.
- For development, use `docker-compose` or mount your code as a volume.
