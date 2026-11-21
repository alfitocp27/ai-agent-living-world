// ─── Seed data Fase A — 10 agent, gedung, tugas contoh ─────────────────────
// Semua angka biaya adalah ESTIMASI DEMO, bukan tagihan provider nyata.
// Provider pilihan pengguna: Muse (muse.ai) — semua agent dilabeli begitu.

import type { AgentProfile, BuildingInfo, Meeting, TaskItem, Vec3, VisualActivity } from '../types';

export const HQ_DOOR = { x: -8, y: 0, z: -2 };
export const MEETING_ROOM = { x: 0, y: 0, z: -6 };
export const CAFE_TERRACE = { x: 14, y: 0, z: 14.5 };
export const POOL_DECK = { x: 18, y: 0, z: 19 };
export const FIELD_CENTER = { x: -6, y: 0, z: -24 };
export const GYM_DOOR = { x: 23, y: 0, z: 9.5 };
export const WARUNG_DOOR = { x: 32, y: 0, z: 3.2 };
export const PLAZA_FOUNTAIN = { x: 2, y: 0, z: 8.5 };

export interface LeisureSpot {
  id: string;
  label: string;
  pos: Vec3;
  visual: VisualActivity;
}

/** Tujuan santai avatar otomatis (dipakai store.pickLeisureDest + agent 3D). */
export const LEISURE_SPOTS: LeisureSpot[] = [
  { id: 'plaza', label: 'Plaza — air mancur', pos: PLAZA_FOUNTAIN, visual: 'idle' },
  { id: 'cafe', label: 'Kafe — ngopi santai', pos: CAFE_TERRACE, visual: 'drinking' },
  { id: 'pool', label: 'Kolam renang', pos: POOL_DECK, visual: 'swimming' },
  { id: 'field', label: 'Lapangan bola', pos: FIELD_CENTER, visual: 'playing' },
  { id: 'gym', label: 'Gym', pos: GYM_DOOR, visual: 'exercising' },
  { id: 'warung', label: 'Warung — jajan', pos: WARUNG_DOOR, visual: 'eating' },
];

export const BUILDINGS: BuildingInfo[] = [
  {
    id: 'hq', name: 'Kantor Pusat — Gedung Utama', kind: 'Kantor 3 lantai',
    pos: { x: -8, y: 0, z: -10 }, floors: 3,
    rooms: ['Lobby & Reception', 'Ruang Meeting', 'Workspace', 'Ruang Programmer', 'Ruang UI/UX & Desain', 'Ruang Manager', 'Ruang Eksekutif'],
    description: 'Gedung utama: L1 lobby & ruang meeting, L2 satu lantai kerja (22 meja: Workspace, Programmer, Desain, Ruang Manager), L3 kosong/cadangan.',
  },
  {
    id: 'server', name: 'Gedung Server', kind: 'Pusat Data',
    pos: { x: 17, y: 0, z: -13 }, floors: 1,
    rooms: ['Ruang Server', 'Konsol Monitoring', 'Ruang Pendingin'],
    description: 'Pusat data kampus: rak server menyala, konsol monitoring, dan unit pendingin.',
  },
  {
    id: 'apartments', name: 'Apartemen AI Agent', kind: 'Hunian',
    pos: { x: -13, y: 0, z: 15 }, floors: 3,
    rooms: ['Lobby Apartemen', 'Kamar Agent', 'Lounge Bersama'],
    description: 'Hunian agent: kamar pribadi, lounge bersama, dan lobby.',
  },
  {
    id: 'cafe', name: 'Kantin & Coffee Shop', kind: 'Sosial',
    pos: { x: 16, y: 0, z: 9.5 }, floors: 1,
    rooms: ['Coffee Shop', 'Kantin', 'Teras Outdoor'],
    description: 'Tempat makan & ngopi: agent makan siang dan coffee break di sini.',
  },
  {
    id: 'gym', name: 'Gym & Game Center', kind: 'Rekreasi',
    pos: { x: 28, y: 0, z: 9.5 }, floors: 1,
    rooms: ['Gym', 'Tenis Meja', 'Biliar'],
    description: 'Gym, tenis meja, dan biliar untuk jadwal olahraga sore. Sebaris dengan kafe (garis tengah z 9.5), di selatan jalan utama.',
  },
  {
    id: 'pool', name: 'Kolam Renang', kind: 'Rekreasi',
    pos: { x: 18, y: 0, z: 19 }, floors: 0,
    rooms: ['Kolam Utama', 'Deck & Kursi Santai'],
    description: 'Kolam renang dengan animasi air dan kursi santai.',
  },
  {
    id: 'field', name: 'Lapangan Sepak Bola Mini', kind: 'Olahraga',
    pos: { x: -6, y: 0, z: -24 }, floors: 0,
    rooms: ['Lapangan', 'Gawang A', 'Gawang B'],
    description: 'Lapangan mini dengan pertandingan simulasi visual dan skor.',
  },
  {
    id: 'warung', name: 'Warung Madura — Buka 24 Jam', kind: 'Kuliner 24 jam',
    pos: { x: 32, y: 0, z: 5 }, floors: 1,
    rooms: ['Etalase', 'Rak Mie & Camilan', 'Kulkas Minuman', 'Konter'],
    description: 'Kios kelontong di tepi jalan utama, timur gym. Buka 24 jam — papan nama dan lampu gantung menyala terus, termasuk malam hari.',
  },
];

const base = (
  p: Partial<AgentProfile> & Pick<AgentProfile, 'id' | 'name' | 'role' | 'team' | 'gender' | 'desk' | 'deskFloor' | 'deskRoom' | 'home'>,
): AgentProfile => ({
  model: 'Muse (muse.ai)',
  provider: 'Muse (muse.ai)',
  systemPrompt: 'Kamu adalah AI Agent profesional di kampus AI Agent Living World.',
  skills: [],
  tools: ['web_search', 'file_read', 'file_write'],
  color: '#2563eb',
  shirt: '#3b82f6',
  pants: '#334155',
  skin: '#f1c27d',
  hair: '#1f2937',
  hairStyle: 'short',
  managerId: 'ag-bimo',
  costTodayUsd: 0,
  tasksDone: 0,
  tasksFailed: 0,
  status: 'online',
  visual: 'idle',
  dest: { x: p.desk.x, y: 0, z: p.desk.z },
  destLabel: p.deskRoom,
  currentTaskId: null,
  paused: false,
  ...p,
});

export const SEED_AGENTS: AgentProfile[] = [
  base({ id: 'ag-nara', name: 'Nara', role: 'CEO Agent', team: 'Executive', gender: 'female', managerId: null, color: '#b45309', shirt: '#f59e0b', pants: '#1e293b', skin: '#f1c27d', hair: '#111827', hairStyle: 'bun', desk: { x: -4.5, y: 3.2, z: -7.5 }, deskFloor: 2, deskRoom: 'Workspace — Meja Eksekutif', home: { x: -24, y: 0, z: 21.5 }, model: 'Muse (muse.ai)', skills: ['strategy', 'delegation', 'decision'], tools: ['web_search', 'file_read', 'file_write', 'task_delegate'] }),
  base({ id: 'ag-bimo', name: 'Bimo', role: 'Manager Agent', team: 'Executive', gender: 'male', managerId: 'ag-nara', color: '#0f766e', shirt: '#14b8a6', pants: '#1e293b', skin: '#e0ac69', hair: '#111827', hairStyle: 'short', desk: { x: 0.5, y: 3.2, z: -4.8 }, deskFloor: 2, deskRoom: 'Ruang Manager', home: { x: -20, y: 0, z: 21.5 }, model: 'Muse (muse.ai)', skills: ['planning', 'coordination', 'reporting'], tools: ['web_search', 'file_read', 'file_write', 'task_delegate'] }),
  base({ id: 'ag-kirana', name: 'Kirana', role: 'Programmer Agent', team: 'Engineering', gender: 'female', managerId: 'ag-bimo', color: '#1d4ed8', shirt: '#2563eb', pants: '#334155', skin: '#ffdbac', hair: '#3f2d20', hairStyle: 'long', desk: { x: -17, y: 3.2, z: -14 }, deskFloor: 2, deskRoom: 'Ruang Programmer', home: { x: -16, y: 0, z: 21.5 }, model: 'Muse (muse.ai)', skills: ['typescript', 'react', 'node'], tools: ['web_search', 'file_read', 'file_write', 'code_run'] }),
  base({ id: 'ag-saka', name: 'Saka', role: 'Programmer Agent', team: 'Engineering', gender: 'male', managerId: 'ag-bimo', color: '#0369a1', shirt: '#0284c7', pants: '#1e293b', skin: '#c68642', hair: '#111827', hairStyle: 'cap', desk: { x: -14.5, y: 3.2, z: -14 }, deskFloor: 2, deskRoom: 'Ruang Programmer', home: { x: -12, y: 0, z: 21.5 }, model: 'Muse (muse.ai)', skills: ['python', 'api', 'database'], tools: ['web_search', 'file_read', 'file_write', 'code_run'] }),
  base({ id: 'ag-lestari', name: 'Lestari', role: 'UI/UX Designer Agent', team: 'Design', gender: 'female', managerId: 'ag-bimo', color: '#be185d', shirt: '#ec4899', pants: '#334155', skin: '#f1c27d', hair: '#111827', hairStyle: 'bun', desk: { x: -3.5, y: 3.2, z: -14 }, deskFloor: 2, deskRoom: 'Ruang UI/UX & Desain', home: { x: -8, y: 0, z: 21.5 }, model: 'Muse (muse.ai)', skills: ['figma', 'design-system', 'prototyping'], tools: ['web_search', 'file_read', 'file_write', 'image_gen'] }),
  base({ id: 'ag-dimas', name: 'Dimas', role: 'Graphic Design Agent', team: 'Design', gender: 'male', managerId: 'ag-bimo', color: '#9d174d', shirt: '#f43f5e', pants: '#1e293b', skin: '#e0ac69', hair: '#111827', hairStyle: 'short', desk: { x: -1, y: 3.2, z: -14 }, deskFloor: 2, deskRoom: 'Ruang UI/UX & Desain', home: { x: -4, y: 0, z: 21.5 }, model: 'Muse (muse.ai)', skills: ['branding', 'illustration', 'layout'], tools: ['web_search', 'file_read', 'image_gen'] }),
  base({ id: 'ag-rani', name: 'Rani', role: 'Copywriter Agent', team: 'Content', gender: 'female', managerId: 'ag-bimo', color: '#7c3aed', shirt: '#8b5cf6', pants: '#334155', skin: '#ffdbac', hair: '#3f2d20', hairStyle: 'long', desk: { x: -17, y: 3.2, z: -7.5 }, deskFloor: 2, deskRoom: 'Workspace', home: { x: 0, y: 0, z: 21.5 }, model: 'Muse (muse.ai)', skills: ['copywriting', 'seo', 'storytelling', 'kuliner', 'resep'], tools: ['web_search', 'file_read', 'file_write'] }),
  base({ id: 'ag-yoga', name: 'Yoga', role: 'Research Agent', team: 'Research', gender: 'male', managerId: 'ag-bimo', color: '#047857', shirt: '#10b981', pants: '#1e293b', skin: '#c68642', hair: '#111827', hairStyle: 'short', desk: { x: -14.5, y: 3.2, z: -7.5 }, deskFloor: 2, deskRoom: 'Workspace', home: { x: -24, y: 0, z: 23.5 }, model: 'Muse (muse.ai)', skills: ['research', 'summarizing', 'citation'], tools: ['web_search', 'file_read', 'file_write'] }),
  base({ id: 'ag-maya', name: 'Maya', role: 'Data Analyst Agent', team: 'Research', gender: 'female', managerId: 'ag-bimo', color: '#0e7490', shirt: '#06b6d4', pants: '#334155', skin: '#f1c27d', hair: '#111827', hairStyle: 'bun', desk: { x: -12, y: 3.2, z: -7.5 }, deskFloor: 2, deskRoom: 'Workspace', home: { x: -20, y: 0, z: 23.5 }, model: 'Muse (muse.ai)', skills: ['sql', 'statistics', 'dashboard'], tools: ['web_search', 'file_read', 'file_write', 'code_run'] }),
  base({ id: 'ag-fajar', name: 'Fajar', role: 'Quality Assurance Agent', team: 'Engineering', gender: 'male', managerId: 'ag-bimo', color: '#b91c1c', shirt: '#ef4444', pants: '#1e293b', skin: '#e0ac69', hair: '#111827', hairStyle: 'short', desk: { x: -9.5, y: 3.2, z: -7.5 }, deskFloor: 2, deskRoom: 'Workspace', home: { x: -16, y: 0, z: 23.5 }, model: 'Muse (muse.ai)', skills: ['testing', 'qa', 'automation'], tools: ['web_search', 'file_read', 'code_run'] }),
];

export const SEED_TASKS: TaskItem[] = [
  {
    id: 'task-website-susu', title: 'Website company profile perusahaan susu', description: 'Riset pasar susu, desain landing page, implementasi React, lalu QA sebelum diserahkan.',
    assigneeId: 'ag-bimo', managerId: 'ag-nara', status: 'queued', priority: 'high', progress: 0, createdAtMin: 480, createdAtMs: 1763000000000, costUsd: 0, demo: true,
    subtasks: [
      { id: 'st-riset', title: 'Riset pasar & kompetitor', agentId: 'ag-yoga', done: false },
      { id: 'st-desain', title: 'Desain UI/UX landing page', agentId: 'ag-lestari', done: false },
      { id: 'st-kode', title: 'Implementasi React + Tailwind', agentId: 'ag-kirana', done: false },
      { id: 'st-copy', title: 'Copywriting company profile', agentId: 'ag-rani', done: false },
      { id: 'st-qa', title: 'QA & pengujian', agentId: 'ag-fajar', done: false },
    ],
  },
];

export const SEED_MEETINGS: Meeting[] = [];
