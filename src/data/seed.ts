// ─── Seed data Fase 1 — 10 agent, gedung, tugas contoh ─────────────────────
// Semua angka biaya adalah ESTIMASI DEMO, bukan tagihan provider nyata.

import type { AgentProfile, BuildingInfo, Meeting, TaskItem } from '../types';

export const HQ_DOOR = { x: -8, y: 0, z: -2 };
export const MEETING_ROOM = { x: 0, y: 0, z: -6 };
export const CAFE_TERRACE = { x: 14, y: 0, z: 14.5 };
export const POOL_DECK = { x: 18, y: 0, z: 19 };
export const FIELD_CENTER = { x: 0, y: 0, z: -24 };
export const GYM_DOOR = { x: 17, y: 0, z: 2.5 };

export const BUILDINGS: BuildingInfo[] = [
  {
    id: 'hq', name: 'Kantor Pusat — Gedung Utama', kind: 'Kantor 3 lantai',
    pos: { x: -8, y: 0, z: -10 }, floors: 3,
    rooms: ['Lobby & Reception', 'Open Workspace', 'Ruang Meeting', 'Ruang Programmer', 'Ruang UI/UX & Desain', 'Ruang CEO', 'Ruang Project Manager', 'Command Center'],
    description: 'Gedung utama 3 lantai (Fase 1; target 4–6 lantai di Fase 2). Interior lengkap di setiap lantai, kaca transparan, lift & tangga dekoratif.',
  },
  {
    id: 'research', name: 'Research & Innovation Lab', kind: 'Laboratorium AI',
    pos: { x: 17, y: 0, z: -13 }, floors: 2,
    rooms: ['Lab AI', 'Perpustakaan Digital', 'Training Center', 'Ruang Server'],
    description: 'Lab penelitian, perpustakaan digital, dan ruang server/monitoring.',
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
    pos: { x: 17, y: 0, z: -2 }, floors: 1,
    rooms: ['Gym', 'Tenis Meja', 'Biliar'],
    description: 'Gym, tenis meja, dan biliar untuk jadwal olahraga sore.',
  },
  {
    id: 'pool', name: 'Kolam Renang', kind: 'Rekreasi',
    pos: { x: 18, y: 0, z: 19 }, floors: 0,
    rooms: ['Kolam Utama', 'Deck & Kursi Santai'],
    description: 'Kolam renang dengan animasi air dan kursi santai.',
  },
  {
    id: 'field', name: 'Lapangan Sepak Bola Mini', kind: 'Olahraga',
    pos: { x: 0, y: 0, z: -24 }, floors: 0,
    rooms: ['Lapangan', 'Gawang A', 'Gawang B'],
    description: 'Lapangan mini dengan pertandingan simulasi visual dan skor.',
  },
];

const base = (
  p: Partial<AgentProfile> & Pick<AgentProfile, 'id' | 'name' | 'role' | 'team' | 'desk' | 'deskFloor' | 'deskRoom' | 'home'>,
): AgentProfile => ({
  model: 'gpt-5-mini (demo)',
  provider: 'OpenAI (belum terhubung)',
  systemPrompt: 'Kamu adalah AI Agent profesional di kampus AI Agent Living World.',
  skills: [],
  tools: ['web_search', 'file_read', 'file_write'],
  color: '#2563eb',
  shirt: '#3b82f6',
  pants: '#334155',
  skin: '#f1c27d',
  hair: '#1f2937',
  hairStyle: 'short',
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
  base({ id: 'ag-nara', name: 'Nara', role: 'CEO Agent', team: 'Executive', color: '#b45309', shirt: '#f59e0b', pants: '#1e293b', skin: '#f1c27d', hair: '#111827', hairStyle: 'bun', desk: { x: -16, y: 6.4, z: -14 }, deskFloor: 3, deskRoom: 'Ruang CEO', home: { x: -24, y: 0, z: 21.5 }, model: 'gpt-5 (demo)', skills: ['strategy', 'delegation', 'decision'], tools: ['web_search', 'file_read', 'file_write', 'task_delegate'] }),
  base({ id: 'ag-bimo', name: 'Bimo', role: 'Manager Agent', team: 'Executive', color: '#0f766e', shirt: '#14b8a6', pants: '#1e293b', skin: '#e0ac69', hair: '#111827', hairStyle: 'short', desk: { x: -6, y: 6.4, z: -14 }, deskFloor: 3, deskRoom: 'Ruang Project Manager', home: { x: -20, y: 0, z: 21.5 }, model: 'gpt-5-mini (demo)', skills: ['planning', 'coordination', 'reporting'], tools: ['web_search', 'file_read', 'file_write', 'task_delegate'] }),
  base({ id: 'ag-kirana', name: 'Kirana', role: 'Programmer Agent', team: 'Engineering', color: '#1d4ed8', shirt: '#2563eb', pants: '#334155', skin: '#ffdbac', hair: '#3f2d20', hairStyle: 'long', desk: { x: -16, y: 3.2, z: -12 }, deskFloor: 2, deskRoom: 'Ruang Programmer', home: { x: -16, y: 0, z: 21.5 }, model: 'claude-sonnet (demo)', skills: ['typescript', 'react', 'node'], tools: ['web_search', 'file_read', 'file_write', 'code_run'] }),
  base({ id: 'ag-saka', name: 'Saka', role: 'Programmer Agent', team: 'Engineering', color: '#0369a1', shirt: '#0284c7', pants: '#1e293b', skin: '#c68642', hair: '#111827', hairStyle: 'cap', desk: { x: -13, y: 3.2, z: -12 }, deskFloor: 2, deskRoom: 'Ruang Programmer', home: { x: -12, y: 0, z: 21.5 }, model: 'gemini-2.5-pro (demo)', skills: ['python', 'api', 'database'], tools: ['web_search', 'file_read', 'file_write', 'code_run'] }),
  base({ id: 'ag-lestari', name: 'Lestari', role: 'UI/UX Designer Agent', team: 'Design', color: '#be185d', shirt: '#ec4899', pants: '#334155', skin: '#f1c27d', hair: '#111827', hairStyle: 'bun', desk: { x: -3, y: 3.2, z: -12 }, deskFloor: 2, deskRoom: 'Ruang UI/UX & Desain', home: { x: -8, y: 0, z: 21.5 }, model: 'gpt-5-mini (demo)', skills: ['figma', 'design-system', 'prototyping'], tools: ['web_search', 'file_read', 'file_write', 'image_gen'] }),
  base({ id: 'ag-dimas', name: 'Dimas', role: 'Graphic Design Agent', team: 'Design', color: '#9d174d', shirt: '#f43f5e', pants: '#1e293b', skin: '#e0ac69', hair: '#111827', hairStyle: 'short', desk: { x: 0, y: 3.2, z: -12 }, deskFloor: 2, deskRoom: 'Ruang UI/UX & Desain', home: { x: -4, y: 0, z: 21.5 }, model: 'gemini-2.5-flash (demo)', skills: ['branding', 'illustration', 'layout'], tools: ['web_search', 'file_read', 'image_gen'] }),
  base({ id: 'ag-rani', name: 'Rani', role: 'Copywriter Agent', team: 'Content', color: '#7c3aed', shirt: '#8b5cf6', pants: '#334155', skin: '#ffdbac', hair: '#3f2d20', hairStyle: 'long', desk: { x: -14, y: 0, z: -11 }, deskFloor: 1, deskRoom: 'Open Workspace', home: { x: 0, y: 0, z: 21.5 }, model: 'gpt-5-mini (demo)', skills: ['copywriting', 'seo', 'storytelling'], tools: ['web_search', 'file_read', 'file_write'] }),
  base({ id: 'ag-yoga', name: 'Yoga', role: 'Research Agent', team: 'Research', color: '#047857', shirt: '#10b981', pants: '#1e293b', skin: '#c68642', hair: '#111827', hairStyle: 'short', desk: { x: -8, y: 0, z: -11 }, deskFloor: 1, deskRoom: 'Open Workspace', home: { x: -24, y: 0, z: 23.5 }, model: 'claude-sonnet (demo)', skills: ['research', 'summarizing', 'citation'], tools: ['web_search', 'file_read', 'file_write'] }),
  base({ id: 'ag-maya', name: 'Maya', role: 'Data Analyst Agent', team: 'Research', color: '#0e7490', shirt: '#06b6d4', pants: '#334155', skin: '#f1c27d', hair: '#111827', hairStyle: 'bun', desk: { x: -4, y: 0, z: -11 }, deskFloor: 1, deskRoom: 'Open Workspace', home: { x: -20, y: 0, z: 23.5 }, model: 'gpt-5-mini (demo)', skills: ['sql', 'statistics', 'dashboard'], tools: ['web_search', 'file_read', 'file_write', 'code_run'] }),
  base({ id: 'ag-fajar', name: 'Fajar', role: 'Quality Assurance Agent', team: 'Engineering', color: '#b91c1c', shirt: '#ef4444', pants: '#1e293b', skin: '#e0ac69', hair: '#111827', hairStyle: 'short', desk: { x: -1, y: 0, z: -11 }, deskFloor: 1, deskRoom: 'Open Workspace', home: { x: -16, y: 0, z: 23.5 }, model: 'gemini-2.5-flash (demo)', skills: ['testing', 'qa', 'automation'], tools: ['web_search', 'file_read', 'code_run'] }),
];

export const SEED_TASKS: TaskItem[] = [
  {
    id: 'task-website-susu', title: 'Website company profile perusahaan susu', description: 'Riset pasar susu, desain landing page, implementasi React, lalu QA sebelum diserahkan.',
    assigneeId: 'ag-bimo', managerId: 'ag-nara', status: 'queued', priority: 'high', progress: 0, createdAtMin: 480, costUsd: 0, demo: true,
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
