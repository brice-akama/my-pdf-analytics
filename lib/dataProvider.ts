// lib/dataProvider.ts
// lib/dataProvider.ts
//
// WHAT THIS FILE DOES:
//   Central React Admin data provider. Routes every CRUD operation to the
//   correct Next.js API route and normalises the response shape React Admin
//   expects: { data, total? }.
//
// RESOURCES HANDLED:
//   "blog"            → /api/blog          (existing, unchanged)
//   "admin/users"     → /api/admin/users   (new — platform owner dashboard)
//   "admin/documents" → /api/admin/documents (new — platform owner dashboard)
//
// KEY FIXES vs the original version:
//
//   1. getOne — removed the blog-specific `rawData.post` unwrap that was
//      applied to EVERY resource. Admin resources return a clean { data: {...} }
//      shape. The blog unwrap now only fires for the "blog" resource.
//
//   2. update — the original returned `data._id` as the record id. Admin routes
//      return normalised objects where `id` is already set (no `_id`). If both
//      are missing we fall back gracefully instead of returning undefined.
//
//   3. updateMany — the original POSTed to /api/{resource}/many which does not
//      exist for admin resources. Admin bulk actions (ban, upgrade) need to call
//      the single-record PUT for each id. We now split: admin resources loop
//      individual PUTs; non-admin resources keep the /many endpoint.
//
//   4. delete — unchanged, already worked correctly.
//
//   5. deleteMany — same split as updateMany: admin resources loop individual
//      DELETEs; others use /many.
//
//   6. getList — unchanged, already worked correctly for all resources since
//      the URL shape /api/{resource}?_page=... is consistent.

import {
  GetManyParams,
  GetManyResult,
  QueryFunctionContext,
  RaRecord,
  GetOneParams,
  GetOneResult,
} from 'react-admin'

// Resources that have dedicated admin API routes.
// Add to this list as you build more admin resources.
const ADMIN_RESOURCES = ['admin/users', 'admin/documents']

function isAdminResource(resource: string) {
  return ADMIN_RESOURCES.includes(resource)
}

const customDataProvider = {
  // ── getList ───────────────────────────────────────────────────────────────
  // Works for all resources — URL shape is consistent across blog and admin.
  getList: async (resource: string, params: any) => {
    const { page, perPage } = params.pagination
    const { field, order } = params.sort

    const query = new URLSearchParams({
      _page: String(page),
      _limit: String(perPage),
      _sort: field || 'id',
      _order: order || 'asc',
    })

    // Forward filter params (search, plan, status, etc.)
    if (params.filter) {
      for (const [key, value] of Object.entries(params.filter)) {
        if (value !== undefined && value !== null && value !== '') {
          query.set(key, String(value))
        }
      }
    }

    const response = await fetch(`/api/${resource}?${query.toString()}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${resource}: ${response.statusText}`)
    }

    const json = await response.json()
    return {
      data: json.data,   // array of records, each must have an `id` field
      total: json.total, // total count for pagination
    }
  },

  // ── getOne ────────────────────────────────────────────────────────────────
  // FIX: the original unwrapped rawData.post for every resource.
  // Now only blog does that. Admin resources get a clean pass-through.
  getOne: async <RecordType extends { id: any }>(
    resource: string,
    params: GetOneParams<RecordType>
  ): Promise<GetOneResult<RecordType>> => {
    const { id } = params
    const response = await fetch(`/api/${resource}?id=${id}`)
    const json = await response.json()

    if (!json.data) {
      throw new Error(`Invalid response from ${resource}: ${JSON.stringify(json)}`)
    }

    let rawData = Array.isArray(json.data) ? json.data[0] : json.data

    // Blog-specific: unwrap nested post shape. Admin resources skip this.
    let data: any
    if (resource === 'blog' && rawData.post) {
      data = { ...rawData.post, relatedPosts: rawData.relatedPosts }
    } else {
      data = rawData
    }

    // Normalise MongoDB _id → id (admin routes already return `id`,
    // but guard here so nothing breaks if a route ever returns _id)
    if (data?._id && !data.id) {
      data.id = data._id
      delete data._id
    }

    if (!data?.id) {
      throw new Error(
        `Record from ${resource} has no id field: ${JSON.stringify(data)}`
      )
    }

    return { data }
  },

  // ── getMany ───────────────────────────────────────────────────────────────
  // Unchanged — used by Reference fields, not by the admin list views directly.
  getMany: async <RecordType extends RaRecord>(
    resource: string,
    params: GetManyParams<RecordType> & QueryFunctionContext
  ): Promise<GetManyResult<RecordType>> => {
    const { ids } = params
    const response = await fetch(`/api/${resource}/many`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    const data = await response.json()
    return { data: Array.isArray(data) ? data : [] }
  },

  // ── getManyReference ──────────────────────────────────────────────────────
  getManyReference: async (resource: string, params: any) => {
    const response = await fetch(`/api/${resource}/reference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const data = await response.json()
    return { data }
  },

  // ── create ────────────────────────────────────────────────────────────────
  // Unchanged — admin panel doesn't create users/docs (users self-register).
  create: async (resource: string, params: any) => {
    if (params.data.image) {
      const formData = new FormData()
      for (const key in params.data) {
        if (key !== 'image') formData.append(key, params.data[key])
      }
      formData.append('image', params.data.image)

      const response = await fetch(`/api/${resource}`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      return { data: { id: data.id, ...data } }
    }

    const response = await fetch(`/api/${resource}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params.data),
    })
    const data = await response.json()
    return { data: { id: data.id, ...data } }
  },

  // ── update ────────────────────────────────────────────────────────────────
  // FIX: original returned `data._id` as id which is undefined for admin routes
  // (they return normalised `id`). Now we try id → _id → params.id as fallback.
  update: async (resource: string, params: any) => {
    if (params.data.image) {
      const formData = new FormData()
      for (const key in params.data) {
        if (key !== 'image') formData.append(key, params.data[key])
      }
      formData.append('image', params.data.image)

      const response = await fetch(`/api/${resource}?id=${params.id}`, {
        method: 'PUT',
        body: formData,
      })
      const data = await response.json()
      return {
        data: {
          id: data.id ?? data._id ?? params.id,
          ...data,
        },
      }
    }

    const response = await fetch(`/api/${resource}?id=${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params.data),
    })
    const json = await response.json()

    if (!response.ok) {
      throw new Error(json.error || `Failed to update ${resource}`)
    }

    // Admin routes return { data: { id, ... } }
    // Blog routes return the raw object with _id
    const record = json.data ?? json
    return {
      data: {
        id: record.id ?? record._id ?? params.id,
        ...record,
      },
    }
  },

  // ── updateMany ────────────────────────────────────────────────────────────
  // FIX: Admin resources don't have a /many endpoint.
  // Loop individual PUTs for admin; keep the /many POST for blog/others.
  // This is what powers the bulk "Ban selected" and "Upgrade to Pro" actions.
  updateMany: async (resource: string, params: any) => {
    if (isAdminResource(resource)) {
      // One PUT per id — runs in parallel
      const results = await Promise.all(
        params.ids.map((id: string | number) =>
          fetch(`/api/${resource}?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params.data),
          }).then((r) => r.json())
        )
      )
      return { data: params.ids }
    }

    // Non-admin: use the existing /many endpoint
    const response = await fetch(`/api/${resource}/many`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const data = await response.json()
    return { data }
  },

  // ── delete ────────────────────────────────────────────────────────────────
  // Unchanged — already worked correctly.
  delete: async <RecordType extends RaRecord>(
    resource: string,
    params: { id: string | number }
  ): Promise<{ data: RecordType }> => {
    const response = await fetch(`/api/${resource}?id=${params.id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete resource')
    }

    return { data: { id: params.id } as RecordType }
  },

  // ── deleteMany ────────────────────────────────────────────────────────────
  // FIX: same split as updateMany — admin loops individual DELETEs.
  deleteMany: async (resource: string, params: any) => {
    if (isAdminResource(resource)) {
      await Promise.all(
        params.ids.map((id: string | number) =>
          fetch(`/api/${resource}?id=${id}`, { method: 'DELETE' })
        )
      )
      return { data: params.ids }
    }

    const response = await fetch(`/api/${resource}/many`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const data = await response.json()
    return { data }
  },
}

export default customDataProvider