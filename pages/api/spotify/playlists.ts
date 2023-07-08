// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosRequestConfig } from 'axios';
import qs from 'qs';

var client_id = 'a25d5fa2e36b446daeb44fe82e4abdcd';
var client_secret = '6a3a55c099984ef79fd6cd2e153900ed';
var userId: string = '1225398661';
var token: string;
var playlists: any[] = [];
var playlistUrl = `https://api.spotify.com/v1/users/${userId}/playlists?limit=50`;

async function getToken() {
  var data = qs.stringify({
    grant_type: 'client_credentials',
  });
  var tokenConfig: AxiosRequestConfig<any> = {
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${client_id}:${client_secret}`
      ).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: data,
  };

  await axios(tokenConfig)
    .then(function (response) {
      token = response.data.access_token;
    })
    .catch(function (error) {
      console.log(error);
    });
  return token;
}

async function getPlaylists() {
  var getPlaylistConfig: AxiosRequestConfig<any> = {
    method: 'get',
    url: playlistUrl,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };
  await axios(getPlaylistConfig)
    .then(function (response) {
      response.data.items.map((playlist: any) => {
        playlists.push(playlist);
      });
    })
    .catch(function (error) {
      console.log(error);
    });
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  console.log(playlists);
  await getToken();
  await getPlaylists();
  res.status(200).json(playlists);
}
