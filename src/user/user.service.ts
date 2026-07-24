import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GithubUserResponse } from '../interfaces/userResponse';
import { GithubRepoResponse } from '../interfaces/GithubRepo';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  constructor(private readonly configService: ConfigService) {}
  async getGithubUser(username: string) {
    const token = this.configService.get<string>('GITHUB_TOKEN');

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const [userResponse, reposResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, { headers }),
      fetch(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`,
        { headers },
      ),
    ]);

    if (!userResponse.ok) {
      console.log('GitHub status:', userResponse.status);
      console.log(
        'GitHub rate limit remaining:',
        userResponse.headers.get('x-ratelimit-remaining'),
      );
      throw new HttpException(
        `Error de GitHub (${userResponse.status}) al buscar: ${username}`,
        userResponse.status === 404
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_GATEWAY,
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
