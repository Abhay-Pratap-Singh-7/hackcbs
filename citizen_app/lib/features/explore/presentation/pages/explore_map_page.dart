import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:latlong2/latlong.dart';
import 'package:sih_2026/core/localization/app_localizations.dart';
import 'package:sih_2026/core/theme/app_colors.dart';
import 'package:sih_2026/features/reports/data/repositories/problem_repository.dart';

class ExploreMapPage extends StatefulWidget {
  final String? initialProblemId;
  final LatLng? initialLocation;

  const ExploreMapPage({
    super.key,
    this.initialProblemId,
    this.initialLocation,
  });

  @override
  State<ExploreMapPage> createState() => _ExploreMapPageState();
}

class _ExploreMapPageState extends State<ExploreMapPage> with TickerProviderStateMixin {
  final ProblemRepository _repository = ProblemRepository();
  List<dynamic> _allProblems = [];
  List<dynamic> _filteredProblems = [];
  bool _isLoading = true;
  final MapController _mapController = MapController();
  
  // Default center: Ranchi, Jharkhand
  final LatLng _defaultCenter = const LatLng(23.3441, 85.3096);
  LatLng? _userLocation;
  
  String _selectedFilter = 'All';
  String _searchQuery = '';
  Map<String, dynamic>? _selectedProblem;
  final TextEditingController _searchController = TextEditingController();
  
  // Map Layer Style
  int _selectedTileIndex = 0;
  final List<Map<String, String>> _tileProviders = [
    {
      'name': 'Street',
      'url': 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    },
    {
      'name': 'Light',
      'url': 'https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    },
    {
      'name': 'Voyager',
      'url': 'https://cartodb-basemaps-a.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png',
    },
  ];

  @override
  void initState() {
    super.initState();
    _fetchProblems();
    _getUserLocation();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _getUserLocation() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
        final position = await Geolocator.getCurrentPosition();
        if (mounted) {
          setState(() {
            _userLocation = LatLng(position.latitude, position.longitude);
          });
        }
      }
    } catch (_) {
      // Keep default location if permission denied or location services disabled
    }
  }

  Future<void> _fetchProblems() async {
    try {
      final response = await _repository.fetchProblems(limit: 100);
      if (mounted) {
        final data = (response['data'] as List<dynamic>?) ?? [];
        
        // Add sample nearby mock coordinates if problems don't have lat/lng
        final enhancedData = _ensureProblemCoordinates(data);

        Map<String, dynamic>? matchedProblem;
        if (widget.initialProblemId != null) {
          try {
            matchedProblem = enhancedData.firstWhere(
              (p) => p['_id'] == widget.initialProblemId,
            );
          } catch (_) {
            matchedProblem = null;
          }
        }

        setState(() {
          _allProblems = enhancedData;
          _filteredProblems = enhancedData;
          _isLoading = false;
          if (matchedProblem != null) {
            _selectedProblem = matchedProblem;
          }
        });

        if (widget.initialLocation != null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _animatedMapMove(widget.initialLocation!, 15.5);
          });
        } else if (matchedProblem != null) {
          final lat = (matchedProblem['location']?['coordinates']?['latitude'] as num?)?.toDouble();
          final lng = (matchedProblem['location']?['coordinates']?['longitude'] as num?)?.toDouble();
          if (lat != null && lng != null) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              _animatedMapMove(LatLng(lat, lng), 15.5);
            });
          }
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load map data: $e')),
        );
      }
    }
  }

  List<dynamic> _ensureProblemCoordinates(List<dynamic> rawList) {
    final rng = Random(42);
    return rawList.map((p) {
      final Map<String, dynamic> problem = Map<String, dynamic>.from(p as Map<String, dynamic>);
      var loc = problem['location'] != null ? Map<String, dynamic>.from(problem['location'] as Map<String, dynamic>) : <String, dynamic>{};
      var coords = loc['coordinates'] != null ? Map<String, dynamic>.from(loc['coordinates'] as Map<String, dynamic>) : null;

      if (coords == null || coords['latitude'] == null || coords['longitude'] == null) {
        // Generate within Ranchi cluster
        final offsetLat = (rng.nextDouble() - 0.5) * 0.08;
        final offsetLng = (rng.nextDouble() - 0.5) * 0.08;
        loc['coordinates'] = {
          'latitude': 23.3441 + offsetLat,
          'longitude': 85.3096 + offsetLng,
        };
        problem['location'] = loc;
      }
      return problem;
    }).toList();
  }

  void _applyFilters() {
    setState(() {
      _filteredProblems = _allProblems.where((p) {
        final title = (p['title'] ?? '').toString().toLowerCase();
        final district = (p['location']?['district'] ?? '').toString().toLowerCase();
        final address = (p['location']?['address'] ?? '').toString().toLowerCase();
        final classification = (p['aiAnalysis']?['problem_classification'] ?? '').toString().toLowerCase();
        final urgency = (p['supportingInfo']?['urgency'] ?? 'MEDIUM').toString().toUpperCase();
        final status = (p['status'] ?? 'SUBMITTED').toString().toUpperCase();

        // Search query filter
        final matchesSearch = _searchQuery.isEmpty ||
            title.contains(_searchQuery.toLowerCase()) ||
            district.contains(_searchQuery.toLowerCase()) ||
            address.contains(_searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        // Category / Urgency filter
        if (_selectedFilter == 'All') return true;
        if (_selectedFilter == 'Critical') return urgency == 'CRITICAL' || urgency == 'HIGH';
        if (_selectedFilter == 'Medium') return urgency == 'MEDIUM';
        if (_selectedFilter == 'Resolved') return status == 'RESOLVED' || status == 'DEPLOYED';
        if (_selectedFilter == 'Infrastructure') return classification.contains('road') || classification.contains('infra') || classification.contains('bridge');
        if (_selectedFilter == 'Water') return classification.contains('water') || classification.contains('drain') || classification.contains('pipeline');
        if (_selectedFilter == 'Electricity') return classification.contains('electric') || classification.contains('power') || classification.contains('light');

        return true;
      }).toList();
    });
  }

  void _onFilterSelected(String filter) {
    setState(() {
      _selectedFilter = filter;
    });
    _applyFilters();
  }

  void _animatedMapMove(LatLng destLocation, double destZoom) {
    final latTween = Tween<double>(
      begin: _mapController.camera.center.latitude,
      end: destLocation.latitude,
    );
    final lngTween = Tween<double>(
      begin: _mapController.camera.center.longitude,
      end: destLocation.longitude,
    );
    final zoomTween = Tween<double>(
      begin: _mapController.camera.zoom,
      end: destZoom,
    );

    final controller = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    final Animation<double> animation = CurvedAnimation(
      parent: controller,
      curve: Curves.easeInOutCubic,
    );

    controller.addListener(() {
      _mapController.move(
        LatLng(latTween.evaluate(animation), lngTween.evaluate(animation)),
        zoomTween.evaluate(animation),
      );
    });

    animation.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        controller.dispose();
      }
    });

    controller.forward();
  }

  double _calculateDistance(LatLng point) {
    final origin = _userLocation ?? _defaultCenter;
    const Distance distance = Distance();
    return distance.as(LengthUnit.Kilometer, origin, point);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          // 1. Full-Screen Interactive Map
          _buildMapLayer(),

          // 2. Top Header (Search Bar & Filter Chips)
          _buildTopSearchAndFilters(),

          // 3. Right Floating Map Actions (Layer selector, Recenter, Location)
          _buildFloatingMapControls(),

          // 4. Bottom Selected Issue Preview Card
          if (_selectedProblem != null)
            _buildBottomProblemCard(_selectedProblem!),
        ],
      ),
    );
  }

  Widget _buildMapLayer() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }

    final currentTile = _tileProviders[_selectedTileIndex]['url']!;

    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: widget.initialLocation ?? _userLocation ?? _defaultCenter,
        initialZoom: widget.initialLocation != null ? 15.5 : 13.0,
        onTap: (tapPosition, point) {
          if (_selectedProblem != null) {
            setState(() {
              _selectedProblem = null;
            });
          }
        },
      ),
      children: [
        TileLayer(
          urlTemplate: currentTile,
          userAgentPackageName: 'com.sih_2026.app',
        ),

        // User Current Location Pulse Marker
        if (_userLocation != null)
          MarkerLayer(
            markers: [
              Marker(
                point: _userLocation!,
                width: 50,
                height: 50,
                child: Center(
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primary.withValues(alpha: 0.2),
                        ),
                      ),
                      Container(
                        width: 16,
                        height: 16,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primary,
                          border: Border.all(color: Colors.white, width: 2.5),
                          boxShadow: const [
                            BoxShadow(color: Colors.black26, blurRadius: 4),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

        // Problem Markers
        MarkerLayer(
          markers: _filteredProblems.map((p) {
            final coords = p['location']['coordinates'];
            final lat = (coords['latitude'] as num).toDouble();
            final lng = (coords['longitude'] as num).toDouble();
            final point = LatLng(lat, lng);
            final isSelected = _selectedProblem != null && _selectedProblem!['_id'] == p['_id'];

            return Marker(
              point: point,
              width: isSelected ? 52 : 44,
              height: isSelected ? 52 : 44,
              child: GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedProblem = p;
                  });
                  _animatedMapMove(point, 14.5);
                },
                child: _buildMarkerWidget(p, isSelected),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildMarkerWidget(Map<String, dynamic> problem, bool isSelected) {
    final urgency = (problem['supportingInfo']?['urgency'] ?? 'MEDIUM').toString().toUpperCase();
    final status = (problem['status'] ?? 'SUBMITTED').toString().toUpperCase();
    final isResolved = status == 'RESOLVED' || status == 'DEPLOYED';

    Color markerBgColor = const Color(0xFF3B82F6); // Blue
    IconData markerIcon = Icons.construction_rounded;

    if (isResolved) {
      markerBgColor = const Color(0xFF10B981); // Green
      markerIcon = Icons.check_circle_rounded;
    } else if (urgency == 'CRITICAL' || urgency == 'HIGH') {
      markerBgColor = const Color(0xFFEF4444); // Red
      markerIcon = Icons.priority_high_rounded;
    } else if (urgency == 'LOW') {
      markerBgColor = const Color(0xFF10B981);
      markerIcon = Icons.eco_rounded;
    } else {
      markerBgColor = const Color(0xFFF59E0B); // Amber
      markerIcon = Icons.report_problem_rounded;
    }

    return AnimatedScale(
      scale: isSelected ? 1.15 : 1.0,
      duration: const Duration(milliseconds: 200),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Pin Shadow
          Positioned(
            bottom: 0,
            child: Container(
              width: 14,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(7),
              ),
            ),
          ),
          
          // Pin Body
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: markerBgColor,
              shape: BoxShape.circle,
              border: Border.all(
                color: isSelected ? Colors.white : Colors.white.withValues(alpha: 0.9),
                width: isSelected ? 3.0 : 2.0,
              ),
              boxShadow: [
                BoxShadow(
                  color: markerBgColor.withValues(alpha: 0.4),
                  blurRadius: isSelected ? 12 : 6,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Icon(
              markerIcon,
              size: isSelected ? 22 : 18,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopSearchAndFilters() {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: SafeArea(
        child: Column(
          children: [
            // Search Bar Card
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x15000000),
                      blurRadius: 16,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new, size: 18, color: Color(0xFF1E293B)),
                      onPressed: () {
                        if (Navigator.of(context).canPop()) {
                          context.pop();
                        } else {
                          context.go('/home');
                        }
                      },
                    ),
                    Expanded(
                      child: TextField(
                        controller: _searchController,
                        onChanged: (val) {
                          setState(() {
                            _searchQuery = val;
                          });
                          _applyFilters();
                        },
                        style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF1E293B)),
                        decoration: InputDecoration(
                          hintText: context.tr('search_map_hint'),
                          hintStyle: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF94A3B8)),
                          filled: false,
                          fillColor: Colors.transparent,
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          errorBorder: InputBorder.none,
                          disabledBorder: InputBorder.none,
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    if (_searchQuery.isNotEmpty)
                      IconButton(
                        icon: const Icon(Icons.clear, size: 18, color: Color(0xFF94A3B8)),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {
                            _searchQuery = '';
                          });
                          _applyFilters();
                        },
                      ),
                    Container(
                      height: 24,
                      width: 1,
                      color: const Color(0xFFE2E8F0),
                    ),
                    IconButton(
                      icon: const Icon(Icons.tune_rounded, size: 20, color: AppColors.primary),
                      onPressed: () => _showFilterSheet(),
                    ),
                  ],
                ),
              ),
            ),

            // Horizontal Filter Chips
            SizedBox(
              height: 40,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _buildFilterChip('All'),
                  _buildFilterChip('Critical', icon: Icons.error_outline_rounded, color: Colors.red),
                  _buildFilterChip('Infrastructure', icon: Icons.construction_rounded),
                  _buildFilterChip('Water', icon: Icons.water_drop_outlined),
                  _buildFilterChip('Electricity', icon: Icons.bolt_rounded),
                  _buildFilterChip('Resolved', icon: Icons.check_circle_outline_rounded, color: Colors.green),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getFilterLabel(String key) {
    switch (key) {
      case 'All':
        return context.tr('filter_all');
      case 'Critical':
        return context.tr('urgency_critical');
      case 'Medium':
        return context.tr('urgency_medium');
      case 'Infrastructure':
        return context.tr('cat_infra');
      case 'Water':
        return context.tr('cat_water');
      case 'Electricity':
        return context.tr('cat_electricity');
      case 'Resolved':
        return context.tr('filter_solved');
      default:
        return key;
    }
  }

  Widget _buildFilterChip(String filterKey, {IconData? icon, Color? color}) {
    final isSelected = _selectedFilter == filterKey;
    final chipColor = color ?? AppColors.primary;
    final label = _getFilterLabel(filterKey);

    return GestureDetector(
      onTap: () => _onFilterSelected(filterKey),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? chipColor : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? chipColor : const Color(0xFFE2E8F0),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 14,
                color: isSelected ? Colors.white : (color ?? const Color(0xFF64748B)),
              ),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected ? Colors.white : const Color(0xFF1E293B),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFloatingMapControls() {
    return Positioned(
      right: 16,
      bottom: _selectedProblem != null ? 240 : 24,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Layer Switcher
          FloatingActionButton.small(
            heroTag: 'map_layer_btn',
            backgroundColor: Colors.white,
            onPressed: () {
              setState(() {
                _selectedTileIndex = (_selectedTileIndex + 1) % _tileProviders.length;
              });
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Switched to ${_tileProviders[_selectedTileIndex]["name"]} Map Layer'),
                  duration: const Duration(seconds: 1),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
            child: const Icon(Icons.layers_rounded, color: Color(0xFF1E293B), size: 20),
          ),
          const SizedBox(height: 10),

          // Recenter to user / Ranchi
          FloatingActionButton.small(
            heroTag: 'recenter_btn',
            backgroundColor: Colors.white,
            onPressed: () {
              final target = _userLocation ?? _defaultCenter;
              _animatedMapMove(target, 14.0);
            },
            child: const Icon(Icons.my_location_rounded, color: AppColors.primary, size: 20),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomProblemCard(Map<String, dynamic> problem) {
    final title = problem['title'] ?? context.tr('civic_concern');
    final desc = problem['description'] ?? '';
    final locationName = problem['location']?['address'] ?? problem['location']?['district'] ?? 'Jharkhand';
    final urgency = (problem['supportingInfo']?['urgency'] ?? 'MEDIUM').toString().toUpperCase();

    // Distance calculation
    final coords = problem['location']['coordinates'];
    final point = LatLng((coords['latitude'] as num).toDouble(), (coords['longitude'] as num).toDouble());
    final distanceKm = _calculateDistance(point);

    // Image
    String imageUrl = 'https://picsum.photos/400/250?random=${problem["_id"].hashCode}';
    final mediaList = problem['imagesAndMedia'] as List<dynamic>?;
    if (mediaList != null && mediaList.isNotEmpty) {
      imageUrl = mediaList.first['url'] ?? imageUrl;
    }

    Color urgencyColor = const Color(0xFFD97706);
    Color urgencyBgColor = const Color(0xFFFEF3C7);
    if (urgency == 'CRITICAL' || urgency == 'HIGH') {
      urgencyColor = const Color(0xFFDC2626);
      urgencyBgColor = const Color(0xFFFEE2E2);
    } else if (urgency == 'LOW') {
      urgencyColor = const Color(0xFF16A34A);
      urgencyBgColor = const Color(0xFFDCFCE7);
    }

    return Positioned(
      bottom: 20,
      left: 16,
      right: 16,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: const [
            BoxShadow(
              color: Color(0x20000000),
              blurRadius: 20,
              offset: Offset(0, 6),
            ),
          ],
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image Thumbnail
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: SizedBox(
                    width: 80,
                    height: 80,
                    child: Image.network(
                      imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        color: const Color(0xFFE2E8F0),
                        child: const Icon(Icons.image_not_supported_outlined, color: Color(0xFF94A3B8)),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),

                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: urgencyBgColor,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              context.trUrgency(urgency),
                              style: GoogleFonts.poppins(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: urgencyColor,
                              ),
                            ),
                          ),
                          Text(
                            '${distanceKm.toStringAsFixed(1)} ${context.tr('km_away')}',
                            style: GoogleFonts.poppins(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.poppins(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(Icons.location_on_outlined, size: 13, color: Color(0xFF64748B)),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              locationName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              desc,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF475569), height: 1.4),
            ),
            const SizedBox(height: 14),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      setState(() {
                        _selectedProblem = null;
                      });
                    },
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      side: const BorderSide(color: Color(0xFFCBD5E1)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    child: Text(
                      context.tr('close'),
                      style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: () {
                      context.push('/issue_details', extra: problem);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          context.tr('view_details'),
                          style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const SizedBox(width: 6),
                        const Icon(Icons.arrow_forward_rounded, size: 16, color: Colors.white),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                context.tr('filter_map_title'),
                style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  'All',
                  'Critical',
                  'Medium',
                  'Infrastructure',
                  'Water',
                  'Electricity',
                  'Resolved'
                ].map((f) => _buildFilterChip(f)).toList(),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: Text(context.tr('apply_filter'), style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

