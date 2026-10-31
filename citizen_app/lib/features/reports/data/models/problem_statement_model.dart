class ProblemStatementModel {
  final String id;
  final String title;
  final String description;
  final LocationModel? location;
  final List<MediaModel> imagesAndMedia;
  final String? desiredOutcome;
  final SupportingInfoModel? supportingInfo;
  final SelfTagsModel? selfTags;
  final AIAnalysisModel? aiAnalysis;
  final bool isDuplicate;
  final DuplicateOfModel? duplicateOf;
  final String? masterTicketId;
  final List<CollegeSuggestionModel> collegeSuggestions;
  final SubmittedByModel? submittedBy;
  final String? acceptedBy;
  final String? acceptedByUniversityName;
  final List<String> rejectedBy;
  final String status;
  final List<String> upvotedBy;
  final List<String> savedBy;
  final List<String> followers;
  final int upvotesCount;
  final int commentsCount;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  ProblemStatementModel({
    required this.id,
    required this.title,
    required this.description,
    this.location,
    this.imagesAndMedia = const [],
    this.desiredOutcome,
    this.supportingInfo,
    this.selfTags,
    this.aiAnalysis,
    this.isDuplicate = false,
    this.duplicateOf,
    this.masterTicketId,
    this.collegeSuggestions = const [],
    this.submittedBy,
    this.acceptedBy,
    this.acceptedByUniversityName,
    this.rejectedBy = const [],
    required this.status,
    this.upvotedBy = const [],
    this.savedBy = const [],
    this.followers = const [],
    this.upvotesCount = 0,
    this.commentsCount = 0,
    this.createdAt,
    this.updatedAt,
  });

  ProblemStatementModel copyWith({
    String? id,
    String? title,
    String? description,
    LocationModel? location,
    List<MediaModel>? imagesAndMedia,
    String? desiredOutcome,
    SupportingInfoModel? supportingInfo,
    SelfTagsModel? selfTags,
    AIAnalysisModel? aiAnalysis,
    bool? isDuplicate,
    DuplicateOfModel? duplicateOf,
    String? masterTicketId,
    List<CollegeSuggestionModel>? collegeSuggestions,
    SubmittedByModel? submittedBy,
    String? acceptedBy,
    String? acceptedByUniversityName,
    List<String>? rejectedBy,
    String? status,
    List<String>? upvotedBy,
    List<String>? savedBy,
    List<String>? followers,
    int? upvotesCount,
    int? commentsCount,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ProblemStatementModel(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      location: location ?? this.location,
      imagesAndMedia: imagesAndMedia ?? this.imagesAndMedia,
      desiredOutcome: desiredOutcome ?? this.desiredOutcome,
      supportingInfo: supportingInfo ?? this.supportingInfo,
      selfTags: selfTags ?? this.selfTags,
      aiAnalysis: aiAnalysis ?? this.aiAnalysis,
      isDuplicate: isDuplicate ?? this.isDuplicate,
      duplicateOf: duplicateOf ?? this.duplicateOf,
      masterTicketId: masterTicketId ?? this.masterTicketId,
      collegeSuggestions: collegeSuggestions ?? this.collegeSuggestions,
      submittedBy: submittedBy ?? this.submittedBy,
      acceptedBy: acceptedBy ?? this.acceptedBy,
      acceptedByUniversityName: acceptedByUniversityName ?? this.acceptedByUniversityName,
      rejectedBy: rejectedBy ?? this.rejectedBy,
      status: status ?? this.status,
      upvotedBy: upvotedBy ?? this.upvotedBy,
      savedBy: savedBy ?? this.savedBy,
      followers: followers ?? this.followers,
      upvotesCount: upvotesCount ?? this.upvotesCount,
      commentsCount: commentsCount ?? this.commentsCount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  factory ProblemStatementModel.fromJson(Map<String, dynamic> json) {
    return ProblemStatementModel(
      id: json['_id'] ?? '',
      title: json['title'] ?? 'No Title',
      description: json['description'] ?? 'No Description',
      location: json['location'] != null ? LocationModel.fromJson(json['location']) : null,
      imagesAndMedia: (json['imagesAndMedia'] as List<dynamic>?)
              ?.map((e) => MediaModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      desiredOutcome: json['desiredOutcome'],
      supportingInfo: json['supportingInfo'] != null
          ? SupportingInfoModel.fromJson(json['supportingInfo'])
          : null,
      selfTags: json['selfTags'] != null ? SelfTagsModel.fromJson(json['selfTags']) : null,
      aiAnalysis: json['aiAnalysis'] != null ? AIAnalysisModel.fromJson(json['aiAnalysis']) : null,
      isDuplicate: json['isDuplicate'] ?? false,
      duplicateOf: json['duplicateOf'] != null
          ? (json['duplicateOf'] is Map
              ? DuplicateOfModel.fromJson(Map<String, dynamic>.from(json['duplicateOf'] as Map))
              : DuplicateOfModel(problemId: json['duplicateOf'].toString()))
          : null,
      masterTicketId: json['masterTicketId'] != null
          ? (json['masterTicketId'] is Map
              ? json['masterTicketId']['_id']?.toString()
              : json['masterTicketId'].toString())
          : null,
      collegeSuggestions: (json['collegeSuggestions'] as List<dynamic>?)
              ?.map((e) => CollegeSuggestionModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      submittedBy: json['submittedBy'] != null
          ? (json['submittedBy'] is Map<String, dynamic>
              ? SubmittedByModel.fromJson(json['submittedBy'])
              : SubmittedByModel(id: json['submittedBy'].toString(), name: 'Citizen'))
          : null,
      acceptedBy: json['acceptedBy']?.toString(),
      acceptedByUniversityName: json['acceptedByUniversityName'],
      rejectedBy: (json['rejectedBy'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      status: json['status'] ?? 'SUBMITTED',
      upvotedBy: (json['upvotedBy'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      savedBy: (json['savedBy'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      followers: (json['followers'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      upvotesCount: json['upvotesCount'] ?? 0,
      commentsCount: json['commentsCount'] ?? (json['comments'] is List ? (json['comments'] as List).length : 0),
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt']) : null,
    );
  }
}

class LocationModel {
  final String? address;
  final String? district;
  final String? state;
  final String? pincode;
  final String? ward;
  final String? block;
  final String? village;
  final double? latitude;
  final double? longitude;

  LocationModel({
    this.address,
    this.district,
    this.state,
    this.pincode,
    this.ward,
    this.block,
    this.village,
    this.latitude,
    this.longitude,
  });

  factory LocationModel.fromJson(Map<String, dynamic> json) {
    return LocationModel(
      address: json['address'],
      district: json['district'],
      state: json['state'],
      pincode: json['pincode'],
      ward: json['ward'],
      block: json['block'],
      village: json['village'],
      latitude: (json['coordinates']?['latitude'] as num?)?.toDouble(),
      longitude: (json['coordinates']?['longitude'] as num?)?.toDouble(),
    );
  }
}

class MediaModel {
  final String url;
  final String? mediaType;
  final String? name;

  MediaModel({required this.url, this.mediaType, this.name});

  factory MediaModel.fromJson(Map<String, dynamic> json) {
    return MediaModel(
      url: json['url'] ?? '',
      mediaType: json['mediaType'],
      name: json['name'],
    );
  }
}

class SupportingInfoModel {
  final String? affectedPopulation;
  final String urgency;
  final String? existingInterventions;

  SupportingInfoModel({
    this.affectedPopulation,
    this.urgency = 'MEDIUM',
    this.existingInterventions,
  });

  factory SupportingInfoModel.fromJson(Map<String, dynamic> json) {
    return SupportingInfoModel(
      affectedPopulation: json['affectedPopulation'],
      urgency: json['urgency'] ?? 'MEDIUM',
      existingInterventions: json['existingInterventions'],
    );
  }
}

class SelfTagsModel {
  final String? suggestedDomain;
  final List<String> keywords;

  SelfTagsModel({this.suggestedDomain, this.keywords = const []});

  factory SelfTagsModel.fromJson(Map<String, dynamic> json) {
    return SelfTagsModel(
      suggestedDomain: json['suggestedDomain'],
      keywords: (json['keywords'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
    );
  }
}

class AIAnalysisModel {
  final String? summary;
  final String? keyPoints;
  final String? problemClassification;
  final String? severity;
  final String? suggestedSolution;
  final List<String> requiredExpertise;
  final DateTime? analyzedAt;

  AIAnalysisModel({
    this.summary,
    this.keyPoints,
    this.problemClassification,
    this.severity,
    this.suggestedSolution,
    this.requiredExpertise = const [],
    this.analyzedAt,
  });

  factory AIAnalysisModel.fromJson(Map<String, dynamic> json) {
    return AIAnalysisModel(
      summary: json['summary'],
      keyPoints: json['key_points'],
      problemClassification: json['problem_classification'],
      severity: json['severity'],
      suggestedSolution: json['suggested_solution'],
      requiredExpertise: (json['required_expertise'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      analyzedAt: json['analyzedAt'] != null ? DateTime.tryParse(json['analyzedAt']) : null,
    );
  }
}

class DuplicateOfModel {
  final String? problemId;
  final double? similarityScore;
  final double? distanceKm;

  DuplicateOfModel({this.problemId, this.similarityScore, this.distanceKm});

  factory DuplicateOfModel.fromJson(Map<String, dynamic> json) {
    String? pId;
    if (json['problemId'] != null) {
      if (json['problemId'] is Map) {
        pId = json['problemId']['_id']?.toString() ?? json['problemId']['id']?.toString();
      } else {
        pId = json['problemId'].toString();
      }
    } else if (json['_id'] != null) {
      pId = json['_id'].toString();
    } else if (json['id'] != null) {
      pId = json['id'].toString();
    }
    return DuplicateOfModel(
      problemId: pId,
      similarityScore: (json['similarityScore'] as num?)?.toDouble(),
      distanceKm: (json['distanceKm'] as num?)?.toDouble(),
    );
  }
}

class MatchBreakdownModel {
  final double? domainScore;
  final double? geoScore;
  final double? semanticScore;

  MatchBreakdownModel({this.domainScore, this.geoScore, this.semanticScore});

  factory MatchBreakdownModel.fromJson(Map<String, dynamic> json) {
    return MatchBreakdownModel(
      domainScore: (json['domain_score'] as num?)?.toDouble(),
      geoScore: (json['geo_score'] as num?)?.toDouble(),
      semanticScore: (json['semantic_score'] as num?)?.toDouble(),
    );
  }
}

class CollegeSuggestionModel {
  final String? collegeName;
  final String? district;
  final double? latitude;
  final double? longitude;
  final double? distanceKm;
  final String? domain;
  final String? facultyExpertise;
  final String? infrastructure;
  final double? matchScore;
  final MatchBreakdownModel? matchBreakdown;

  CollegeSuggestionModel({
    this.collegeName,
    this.district,
    this.latitude,
    this.longitude,
    this.distanceKm,
    this.domain,
    this.facultyExpertise,
    this.infrastructure,
    this.matchScore,
    this.matchBreakdown,
  });

  int get formattedMatchScore {
    if (matchScore == null || matchScore! <= 0) return 0;
    if (matchScore! <= 1.0) {
      return (matchScore! * 100).round().clamp(0, 100);
    }
    return matchScore!.round().clamp(0, 100);
  }

  factory CollegeSuggestionModel.fromJson(Map<String, dynamic> json) {
    return CollegeSuggestionModel(
      collegeName: json['college_name'],
      district: json['district'],
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      distanceKm: (json['distance_km'] as num?)?.toDouble(),
      domain: json['domain'],
      facultyExpertise: json['faculty_expertise'],
      infrastructure: json['infrastructure'],
      matchScore: (json['match_score'] as num?)?.toDouble(),
      matchBreakdown: json['match_breakdown'] != null && json['match_breakdown'] is Map<String, dynamic>
          ? MatchBreakdownModel.fromJson(json['match_breakdown'])
          : null,
    );
  }
}

class SubmittedByModel {
  final String id;
  final String name;
  final String? avatar;

  SubmittedByModel({required this.id, required this.name, this.avatar});

  factory SubmittedByModel.fromJson(Map<String, dynamic> json) {
    return SubmittedByModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? 'Citizen',
      avatar: json['avatar'],
    );
  }
}
