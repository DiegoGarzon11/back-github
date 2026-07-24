import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GithubUserResponse } from '../interfaces/userResponse';
import { GithubRepoResponse } from '../interfaces/GithubRepo';

@Injectable()
export class UserService {
  async getGithubUser(username: string) {
    const [userResponse, reposResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`),
      fetch(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`,
      ),
    ]);

    if (!userResponse.ok) {
      throw new HttpException(
        `No se encontró el usuario de GitHub: ${username}`,
        HttpStatus.NOT_FOUND,
      );
    }

    const data = (await userResponse.json()) as GithubUserResponse;
    const repos: GithubRepoResponse[] = reposResponse.ok
      ? ((await reposResponse.json()) as GithubRepoResponse[])
      : [];

    return {
      username: data.login,
      name: data.name,
      avatarUrl: data.avatar_url,
      bio: data.bio,
      company: data.company,
      location: data.location,
      blog: data.blog,
      publicRepos: data.public_repos,
      followers: data.followers,
      following: data.following,
      createdAt: data.created_at,
      profileUrl: data.html_url,
      repos: repos.map((repo) => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        updatedAt: repo.updated_at,
      })),
    };
  }
}
