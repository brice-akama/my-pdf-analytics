// lib/dataProvider.ts
import { 
  GetManyParams, 
  GetManyResult, 
  QueryFunctionContext, 
  RaRecord, 
  GetOneParams, 
  GetOneResult 
} from 'react-admin';

const customDataProvider = {
  getList: async (resource: string, params: any) => {
    const { page, perPage } = params.pagination; // ✅ Extract pagination
    const { field, order } = params.sort; // ✅ Extract sorting

    // ✅ Build query parameters
    const query = new URLSearchParams({
        _page: String(page),
        _limit: String(perPage),
        _sort: field || "id", // Default sort field
        _order: order || "asc", // Default sort order
    });

    // ✅ Fetch data from API
    const response = await fetch(`/api/${resource}?${query.toString()}`);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch ${resource}: ${response.statusText}`);
    }

    const data = await response.json(); // ✅ Followed your structure

    // ✅ Ensure `data` is used correctly
    return { 
        data: data.data,  // ✅ Expecting `data.data` to be an array
        total: data.total // ✅ Ensure `total` is returned properly
    };
},

  

  getOne: async <RecordType extends { id: any }>(
  resource: string,
  params: GetOneParams<RecordType>
): Promise<GetOneResult<RecordType>> => {
  const { id } = params;
  const response = await fetch(`/api/${resource}?id=${id}`);
  const json = await response.json();

  if (!json.data) {
    throw new Error(`Invalid response: ${JSON.stringify(json)}`);
  }

  // ✅ Handle nested `post` and `relatedPosts`
  let rawData = Array.isArray(json.data) ? json.data[0] : json.data;
  let data = rawData.post ? { ...rawData.post, relatedPosts: rawData.relatedPosts } : rawData;

  // ✅ Normalize _id → id
  if (data?._id && !data.id) {
    data.id = data._id;
    delete data._id;
  }

  if (!data?.id) {
    throw new Error(`Invalid response: ${JSON.stringify(json)}`);
  }

  return { data };
},


  getMany: async <RecordType extends RaRecord>(
    resource: string, 
    params: GetManyParams<RecordType> & QueryFunctionContext
  ): Promise<GetManyResult<RecordType>> => {
    const { ids } = params;
    const response = await fetch(`/api/${resource}/many`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
    const data = await response.json();
    
    // Ensure the response has the 'data' key
    return { data: Array.isArray(data) ? data : [] }; // Wrap data in 'data' key if necessary
  },
  

  getManyReference: async (resource: string, params: any) => {
    const response = await fetch(`/api/${resource}/reference`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return { data };
  },

  create: async (resource: string, params: any) => {
    // Check if the resource has a file (image) in the data
    if (params.data.image) {
      const formData = new FormData();
      
      // Append regular fields
      for (const key in params.data) {
        if (key !== 'image') {
          formData.append(key, params.data[key]);
        }
      }
      
      // Append the image file if it exists
      formData.append('image', params.data.image);
  
      // Make the fetch request with multipart/form-data
      const response = await fetch(`/api/${resource}`, {
        method: 'POST',
        body: formData,
      });
  
      const data = await response.json();
      return { data: { id: data.id, ...data } };
    } else {
      // For resources that don't require a file, send as JSON
      const response = await fetch(`/api/${resource}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params.data),
      });
  
      const data = await response.json();
      return { data: { id: data.id, ...data } };
    }
  },

  update: async (resource: string, params: any) => {
    // Check if the resource has a file (image) in the data
    if (params.data.image) {
      const formData = new FormData();
  
      // Append regular fields (excluding 'image')
      for (const key in params.data) {
        if (key !== 'image') {
          formData.append(key, params.data[key]);
        }
      }
  
      // Append the image file if it exists
      formData.append('image', params.data.image);
  
      // Make the fetch request with multipart/form-data
      const response = await fetch(`/api/${resource}?id=${params.id}`, {
        method: 'PUT',
        body: formData,  // Send the form data with image
      });
  
      const data = await response.json();
  
      // Ensure the response has the correct structure
      return { data: { id: data._id, ...data } };
    } else {
      // If no image is involved, send the data as JSON
      const response = await fetch(`/api/${resource}?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params.data),  // Send the regular data as JSON
      });
      
      const data = await response.json();
  
      // Ensure the response has the correct structure
      return { data: { id: data._id, ...data } };
    }
  },
  


  updateMany: async (resource: string, params: any) => {
    const response = await fetch(`/api/${resource}/many`, {
      method: 'PUT',
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return { data };
  },

  delete: async <RecordType extends RaRecord>(
    resource: string,
    params: { id: string | number }
  ): Promise<{ data: RecordType }> => {
    const response = await fetch(`/api/${resource}?id=${params.id}`, {
      method: "DELETE",
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete resource");
    }
  
    // Ensure that `data` conforms to RecordType
    return { data: { id: params.id } as RecordType };
  },
  

  deleteMany: async (resource: string, params: any) => {
    const response = await fetch(`/api/${resource}/many`, {
      method: 'DELETE',
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return { data };
  },
};

export default customDataProvider;