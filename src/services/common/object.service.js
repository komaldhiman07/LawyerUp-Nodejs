export const albumObj = (data) => ({
  _id: data._id,
  name: data.name || null,
  event_name: data.event_name || null,
  place: data.place || null,
  date: data.date || null,
  associated_club: data.associated_club || null,
  event_results: data.event_results || null,
  posts: getPosts(data.posts) || null,
  reportedAlbums: reportedAlbum(data.reportedAlbums) || null,
  notes: notesObj(data.notes) || null,
  teams: data.teams || null,
  description: data.description || null,
  experts: getExperts(data.experts) || null,
  estimated_price: data.estimated_price || null,
  estimated_time: data.estimated_time || null,
  quote_description: data.quote_description || null,
  review_description: data.review_description || null,
  review_attachments: data.review_attachments || null,
  report_count: data.report_count || 0,
  created_by: getUser(data.created_by) || null,
  status: data.status || null,
  created_at: data.created_at || null,
});

export const notesObj = (data) => {
  let notes = [];
  if (data && data.length) {
    notes = data.map((e) => ({
      post_id: e.post_id || null,
      time: e.time || null,
      description: e.description || null,
      created_by: getUser(e.created_by) || null,
    }));
  }
  return notes;
};

export const reportedAlbum = (data) => {
  let reportedAlbums = [];
  if (data && data.length) {
    reportedAlbums = data.map((e) => ({
      reported_album_id: e._id,
      title: e.title || null,
      description: e.description || null,
      reviewer: getUser(e.reviewer_id) || null,
    }));
  }
  return reportedAlbums;
};

export const reportedAlbumObj = (data) => ({
  reported_album_id: data._id,
  title: data.title || null,
  description: data.description || null,
  reviewer: getUser(data.reviewer_id) || null,
});

export const getPosts = (data) => {
  let posts = [];
  if (data && data.length) {
    posts = data.map((e) => ({
      _id: e._id || null,
      description: e.description || null,
      attention_period: e.attention_period || null,
      review_expectations: e.review_expectations || null,
      unique_name: e.unique_name || null,
      notes: e.notes || [],
      video: e.video || null,
      thumbnail: e.thumbnail || null,
      video_hls: e.video_hls || null,
      created_at: e.created_at || null,
      album_id: e.album_id || null,
      video_duration: e.video_duration || null,
      is_deleted: e.is_deleted || null,
    }));
  }
  return posts;
};

const getExperts = (data) => {
  let experts = [];
  if (data && data.length) {
    experts = data.map((e) => ({
      _id: e._id || null,
      first_name: e.first_name || null,
      last_name: e.last_name || null,
      experience: e.experience || null,
      profile_image: e.profile_image || null,
      averageRating: e.averageRating || null,
      price: e.price || null,
      time_period: e.time_period || null
    }));
  }
  return experts;
};

const getUser = (data) => {
  let user = {};
  if (data) {
    user = {
      _id: data._id || null,
      first_name: data.first_name || null,
      last_name: data.last_name || null,
      profile_image: data.profile_image || null,
    };
  }
  return user;
};

const getCountryState = (data) => {
  let obj = {
    _id: null,
    name: null,
  };
  if (data) {
    obj = {
      _id: data._id || null,
      name: data.name || null,
    };
  }
  return obj;
};

export const authObj = (data) => ({
  _id: data._id || null,
  role_id: data.role_id || null,
  login_type: data.login_type || null,
  social_key: data.social_key || null,
  first_name: data.first_name || null,
  last_name: data.last_name || null,
  club_name: data.club_name || null,
  url: data.url || null,
  coach_name: data.coach_name || null,
  coach_email: data.coach_email || null,
  coach_phone: data.coach_phone || null,
  email: data.email || null,
  phone: data.phone || null,
  profile_image: data.profile_image || null,
  otp: data.otp || null,
  is_otp_verified: data.is_otp_verified || null,
  address: data.address || null,
  country_id: getCountryState(data.country_id) || null,
  state_id: getCountryState(data.state_id) || null,
  city: data.city || null,
  language: getCountryState(data.language) || null,
  gender: data.gender || null,
  initials_for_concent: data.initials_for_concent || null,
  initials_for_date: data.initials_for_date || null,
  public_profile_url: data.public_profile_url || null,
  crediential_document: data.crediential_document || null,
  talent: data.talent || null,
  club: data.club || null,
  other_club_name: data.other_club_name || null,
  price: data.price || null,
  experience: data.experience || null,
  age: data.age || null,
  type_of_club: data.type_of_club || null,
  specialization: data.specialization || null,
  time_period: data.time_period || null,
  last_login: data.last_login || null,
  competition_category: data.competition_category || null,
  status: data.status || null,
  zip_code: data.zip_code || null,
  averageRating: data.averageRating || null,
  term_and_condition: data.term_and_condition || null,
  declaration: data.declaration || null,
  is_deleted: data.is_deleted || null,
  createdAt: data.createdAt || null,
  updatedAt: data.updatedAt || null,
  __v: data._v || null,
});
