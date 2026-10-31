import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:sih_2026/core/theme/app_colors.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:sih_2026/features/reports/data/repositories/problem_repository.dart';
import 'package:sih_2026/features/notifications/data/repositories/notification_repository.dart';
import 'package:sih_2026/core/localization/app_localizations.dart';

class ReportIssuePage extends StatefulWidget {
  const ReportIssuePage({super.key});

  @override
  State<ReportIssuePage> createState() => _ReportIssuePageState();
}

class _ReportIssuePageState extends State<ReportIssuePage> {
  int _currentStep = 1;
  static const int _totalSteps = 3;

  // Controllers
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();

  // Form Selections
  String _selectedCategory = 'Other Concern';

  // Category list with icons and metadata
  final List<Map<String, dynamic>> _categories = [
    {'name': 'Water Management', 'icon': Icons.water_drop_outlined, 'color': Color(0xFF0284C7)},
    {'name': 'Roads & Transport', 'icon': Icons.edit_road_outlined, 'color': Color(0xFFD97706)},
    {'name': 'Sanitation', 'icon': Icons.cleaning_services_outlined, 'color': Color(0xFF059669)},
    {'name': 'Electricity', 'icon': Icons.electric_bolt_outlined, 'color': Color(0xFFF59E0B)},
    {'name': 'Environment', 'icon': Icons.eco_outlined, 'color': Color(0xFF10B981)},
    {'name': 'Public Infra', 'icon': Icons.apartment_outlined, 'color': Color(0xFF6366F1)},
    {'name': 'Healthcare', 'icon': Icons.health_and_safety_outlined, 'color': Color(0xFFEF4444)},
    {'name': 'Education', 'icon': Icons.menu_book_outlined, 'color': Color(0xFF8B5CF6)},
    {'name': 'Other Concern', 'icon': Icons.more_horiz_rounded, 'color': Color(0xFF64748B)},
  ];

  // Media & Location
  final ImagePicker _picker = ImagePicker();
  final List<XFile> _images = [];
  Position? _currentPosition;
  Placemark? _currentPlacemark;
  String _locationStatus = 'Detecting GPS location...';
  bool _isFetchingLocation = false;

  // Voice to text
  late stt.SpeechToText _speech;
  bool _isListening = false;
  String _baseTextBeforeVoice = '';

  // Submitting state
  bool _isLoading = false;
  final ProblemRepository _repository = ProblemRepository();

  @override
  void initState() {
    super.initState();
    _speech = stt.SpeechToText();
    _fetchLocation();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  void _listen() async {
    if (!_isListening) {
      try {
        bool available = await _speech.initialize(
          onStatus: (status) {
            if ((status == 'notListening' || status == 'done') && mounted) {
              setState(() => _isListening = false);
            }
          },
          onError: (errorNotification) {
            if (mounted) {
              setState(() => _isListening = false);
            }
          },
        );

        if (available) {
          setState(() {
            _isListening = true;
            _baseTextBeforeVoice = _descController.text.trim();
          });

          await _speech.listen(
            onResult: (val) {
              if (mounted) {
                setState(() {
                  final spoken = val.recognizedWords.trim();
                  if (spoken.isNotEmpty) {
                    if (_baseTextBeforeVoice.isEmpty) {
                      _descController.text = spoken;
                    } else {
                      _descController.text = '$_baseTextBeforeVoice $spoken';
                    }
                    _descController.selection = TextSelection.fromPosition(
                      TextPosition(offset: _descController.text.length),
                    );
                  }
                });
              }
            },
            listenOptions: stt.SpeechListenOptions(
              partialResults: true,
              cancelOnError: false,
              listenMode: stt.ListenMode.dictation,
            ),
          );
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Microphone permission denied or speech recognition unavailable on device.'),
                backgroundColor: Color(0xFFDC2626),
                duration: Duration(seconds: 3),
              ),
            );
          }
        }
      } catch (e) {
        if (mounted) {
          setState(() => _isListening = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Could not start speech recognition: $e'),
              backgroundColor: const Color(0xFFDC2626),
            ),
          );
        }
      }
    } else {
      setState(() => _isListening = false);
      await _speech.stop();
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1920,
      );
      if (image != null) {
        CroppedFile? croppedFile;
        try {
          croppedFile = await ImageCropper().cropImage(
            sourcePath: image.path,
            uiSettings: [
              AndroidUiSettings(
                toolbarTitle: 'Crop Photo',
                toolbarColor: AppColors.primary,
                toolbarWidgetColor: Colors.white,
                initAspectRatio: CropAspectRatioPreset.ratio16x9,
                lockAspectRatio: false,
              ),
              IOSUiSettings(
                title: 'Crop Photo',
                aspectRatioLockEnabled: false,
              ),
            ],
          );
        } catch (_) {}

        if (mounted) {
          setState(() {
            _images.add(croppedFile != null ? XFile(croppedFile.path) : image);
          });
        }
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to select image: $e')),
      );
    }
  }

  void _removeImage(int index) {
    setState(() {
      _images.removeAt(index);
    });
  }

  Future<Position?> _determinePosition() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return null;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return null;
    }

    if (permission == LocationPermission.deniedForever) return null;

    return await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 8),
      ),
    );
  }

  Future<void> _fetchLocation() async {
    if (_isFetchingLocation) return;
    setState(() {
      _isFetchingLocation = true;
      _locationStatus = 'Detecting GPS coordinates...';
    });

    try {
      final pos = await _determinePosition();
      Placemark? placemark;
      if (pos != null) {
        try {
          List<Placemark> placemarks = await Geocoding().placemarkFromCoordinates(pos.latitude, pos.longitude);
          if (placemarks.isNotEmpty) {
            placemark = placemarks.first;
          }
        } catch (_) {}
      }

      if (mounted) {
        setState(() {
          _currentPosition = pos;
          _currentPlacemark = placemark;
          _isFetchingLocation = false;

          if (pos != null) {
            final locName = placemark?.subLocality?.isNotEmpty == true 
                ? placemark!.subLocality! 
                : (placemark?.locality?.isNotEmpty == true ? placemark!.locality! : 'GPS Acquired');
            final districtName = placemark?.subAdministrativeArea?.isNotEmpty == true
                ? placemark!.subAdministrativeArea!
                : (placemark?.administrativeArea ?? 'Local Area');

            _locationStatus = '$locName, $districtName';

            if (_addressController.text.isEmpty && placemark != null) {
              final street = placemark.street ?? '';
              final subLoc = placemark.subLocality ?? '';
              final loc = placemark.locality ?? '';
              _addressController.text = [street, subLoc, loc].where((s) => s.isNotEmpty).join(', ');
            }
          } else {
            _locationStatus = 'GPS unavailable. Please enter area manually.';
          }
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isFetchingLocation = false;
          _locationStatus = 'Could not acquire GPS. Please enter area manually.';
        });
      }
    }
  }

  void _nextStep() {
    if (_currentStep == 1) {
      final desc = _descController.text.trim();
      if (desc.length < 50) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.tr('min_50_chars_req')),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
        return;
      }
    }

    if (_currentStep == 2 && _currentPosition == null) {
      _fetchLocation();
    }

    setState(() {
      if (_currentStep < _totalSteps) _currentStep++;
    });
  }

  void _prevStep() {
    setState(() {
      if (_currentStep > 1) _currentStep--;
    });
  }

  Future<void> _submitProblem() async {
    final liveDistrict = _currentPlacemark?.subAdministrativeArea?.isNotEmpty == true
        ? _currentPlacemark!.subAdministrativeArea!
        : (_currentPlacemark?.locality?.isNotEmpty == true
            ? _currentPlacemark!.locality!
            : (_currentPlacemark?.administrativeArea ?? "Local Area"));

    final liveState = _currentPlacemark?.administrativeArea?.isNotEmpty == true
        ? _currentPlacemark!.administrativeArea!
        : "State";

    final liveAddress = _addressController.text.trim().isNotEmpty
        ? _addressController.text.trim()
        : ([_currentPlacemark?.street, _currentPlacemark?.subLocality, _currentPlacemark?.locality, liveDistrict, liveState]
            .where((s) => s != null && s.isNotEmpty)
            .join(', '));

    final title = _titleController.text.trim().isNotEmpty
        ? _titleController.text.trim()
        : '$_selectedCategory Concern at $liveDistrict';
    final desc = _descController.text.trim();

    if (desc.length < 50) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.tr('min_50_chars_req')),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // 1. Upload Media
      List<Map<String, dynamic>> finalImages = [];
      if (_images.isNotEmpty) {
        try {
          final uploadResponse = await _repository.uploadImages(_images.map((e) => e.path).toList());
          for (var img in uploadResponse) {
            finalImages.add({
              "url": img['url'],
              "mediaType": img['mediaType'] ?? 'image',
              "name": img['name'] ?? 'Citizen Evidence'
            });
          }
        } catch (_) {
          finalImages.add({
            "url": "https://picsum.photos/600/350?random=${DateTime.now().millisecondsSinceEpoch}",
            "mediaType": "image",
            "name": "Citizen Evidence"
          });
        }
      } else {
        finalImages.add({
          "url": "https://picsum.photos/600/350?random=${DateTime.now().millisecondsSinceEpoch}",
          "mediaType": "image",
          "name": "Civic Record"
        });
      }

      // 2. Build backend payload with dynamically detected location
      final payload = {
        "title": title,
        "description": desc,
        "location": {
          "address": liveAddress,
          "district": liveDistrict,
          "state": liveState,
          "pincode": _currentPlacemark?.postalCode ?? "",
          "ward": "",
          "block": _currentPlacemark?.subLocality ?? "",
          "village": _currentPlacemark?.locality ?? "",
          "latitude": _currentPosition?.latitude,
          "longitude": _currentPosition?.longitude,
          "coordinates": {
            "latitude": _currentPosition?.latitude,
            "longitude": _currentPosition?.longitude
          }
        },
        "imagesAndMedia": finalImages,
        "supportingInfo": {
          "urgency": "MEDIUM",
        },
        "selfTags": {
          "suggestedDomain": _selectedCategory,
          "keywords": [_selectedCategory, liveDistrict]
        }
      };

      // 3. Post to backend
      final response = await _repository.submitProblemStatement(payload);

      if (!mounted) return;

      final isDuplicate = response['isDuplicate'] == true;
      final data = response['data'] ?? {};

      if (isDuplicate) {
        final dedup = data['deduplicationDetails'] ?? data['duplicateOf'] ?? {};
        final rawSim = (dedup['similarity_score'] ?? dedup['similarityScore'] ?? 0.9) as num;
        final simPercent = rawSim <= 1.0 ? (rawSim * 100).toInt() : rawSim.toInt();
        final distanceKm = dedup['distance_km'] ?? dedup['distanceKm'];
        final matchedTitle = dedup['matched_title'] ?? 'Existing Civic Issue Nearby';

        await showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            contentPadding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            actionsPadding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
            title: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(
                    color: Color(0xFFFEF3C7),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.copy_rounded, color: Color(0xFFD97706), size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    context.tr('similar_issue_found'),
                    style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF92400E)),
                  ),
                ),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  context.tr('dedup_desc'),
                  style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF475569)),
                ),
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFBEB),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFCD34D)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        matchedTitle,
                        style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFDE68A),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '$simPercent% ${context.tr('similarity')}',
                              style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF92400E)),
                            ),
                          ),
                          if (distanceKm != null)
                            Text(
                              '• ${distanceKm is num ? distanceKm.toStringAsFixed(2) : distanceKm} ${context.tr('km_away')}',
                              style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFFB45309)),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  context.tr('home_subtitle'),
                  style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B), height: 1.35),
                ),
              ],
            ),
            actions: [
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.of(ctx).pop();
                        context.go('/home');
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          context.tr('go_to_home'),
                          style: GoogleFonts.poppins(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(ctx).pop();
                        context.pushReplacement('/issue_details', extra: data);
                      },
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        backgroundColor: AppColors.primary,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              context.tr('view_details'),
                              style: GoogleFonts.poppins(
                                fontSize: 12.5,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.arrow_forward_rounded, size: 14, color: Colors.white),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      } else {
        // Unique problem created: Update notification count and navigate to issue details
        NotificationRepository().getUnreadCount();
        context.pushReplacement('/issue_details', extra: data);
      }

    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFF1E293B), size: 18),
          onPressed: () {
            if (_currentStep > 1) {
              _prevStep();
            } else {
              context.pop();
            }
          },
        ),
        title: Text(
          context.tr('report_issue_title'),
          style: GoogleFonts.poppins(
            color: const Color(0xFF1E293B),
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          Column(
            children: [
              _buildStepper(),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  child: _buildCurrentStepContent(),
                ),
              ),
            ],
          ),

          // Loading Overlay
          if (_isLoading)
            Container(
              color: Colors.black54,
              alignment: Alignment.center,
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 32),
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircularProgressIndicator(color: AppColors.primary),
                    const SizedBox(height: 20),
                    Text(
                      context.tr('ai_analyzing_problem'),
                      style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      context.tr('analyzing_severity_desc'),
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
          ),
          child: Row(
            children: [
              if (_currentStep > 1) ...[
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isLoading ? null : _prevStep,
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      side: const BorderSide(color: Color(0xFFCBD5E1)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Text(
                      context.tr('back'),
                      style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
              ],
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : (_currentStep == _totalSteps ? _submitProblem : _nextStep),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _currentStep == _totalSteps ? context.tr('submit') : context.tr('next'),
                        style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      const SizedBox(width: 6),
                      Icon(
                        _currentStep == _totalSteps ? Icons.auto_awesome : Icons.arrow_forward_rounded,
                        size: 16,
                        color: Colors.white,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStepper() {
    final titles = [
      context.tr('step_details').split('.').last.trim(),
      context.tr('step_evidence').split('.').last.trim(),
      context.tr('step_location').split('.').last.trim(),
    ];
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
      child: Row(
        children: List.generate(_totalSteps, (index) {
          final stepNum = index + 1;
          final isCompleted = _currentStep > stepNum;
          final isCurrent = _currentStep == stepNum;

          return Expanded(
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      Container(
                        width: 26,
                        height: 26,
                        decoration: BoxDecoration(
                          color: isCompleted || isCurrent ? AppColors.primary : const Color(0xFFF1F5F9),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isCurrent ? AppColors.primary : (isCompleted ? AppColors.primary : const Color(0xFFCBD5E1)),
                            width: isCurrent ? 2 : 1,
                          ),
                        ),
                        alignment: Alignment.center,
                        child: isCompleted
                            ? const Icon(Icons.check, size: 14, color: Colors.white)
                            : Text(
                                '$stepNum',
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: isCurrent ? Colors.white : const Color(0xFF94A3B8),
                                ),
                              ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        titles[index],
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          fontWeight: isCurrent ? FontWeight.bold : FontWeight.w500,
                          color: isCurrent ? AppColors.primary : const Color(0xFF94A3B8),
                        ),
                      ),
                    ],
                  ),
                ),
                if (index < _totalSteps - 1)
                  Container(
                    height: 2,
                    width: 24,
                    margin: const EdgeInsets.only(bottom: 16),
                    color: _currentStep > stepNum ? AppColors.primary : const Color(0xFFE2E8F0),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _buildCurrentStepContent() {
    switch (_currentStep) {
      case 1:
        return _buildStep1Details();
      case 2:
        return _buildStep2Evidence();
      case 3:
        return _buildStep3Location();
      default:
        return _buildStep1Details();
    }
  }

  // STEP 1: What / Details
  Widget _buildStep1Details() {
    final charCount = _descController.text.trim().length;
    final isDescValid = charCount >= 50;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          context.tr('what_happened'),
          style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
        ),
        const SizedBox(height: 4),
        Text(
          context.tr('provide_short_desc'),
          style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B)),
        ),
        const SizedBox(height: 16),

        // Title
        Text(context.tr('issue_title_label'), style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
        const SizedBox(height: 6),
        TextField(
          controller: _titleController,
          style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF1E293B)),
          decoration: InputDecoration(
            hintText: context.tr('issue_title_hint'),
            hintStyle: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF94A3B8)),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
        ),
        const SizedBox(height: 16),

        // Description + Voice
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(context.tr('issue_desc_label'), style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
            Row(
              children: [
                if (_isListening)
                  Text('${context.tr('listening')} ', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.red)),
                GestureDetector(
                  onTap: _listen,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _isListening ? const Color(0xFFFEE2E2) : const Color(0xFFF0FDF4),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: _isListening ? Colors.red : AppColors.primary),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _isListening ? Icons.mic : Icons.mic_none,
                          size: 14,
                          color: _isListening ? Colors.red : AppColors.primary,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _isListening ? context.tr('stop') : context.tr('voice_dictate'),
                          style: GoogleFonts.poppins(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: _isListening ? Colors.red : AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _descController,
          maxLines: 4,
          onChanged: (_) => setState(() {}),
          style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF1E293B)),
          decoration: InputDecoration(
            hintText: context.tr('issue_desc_hint'),
            hintStyle: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF94A3B8)),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
            contentPadding: const EdgeInsets.all(16),
          ),
        ),
        const SizedBox(height: 6),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              isDescValid ? context.tr('desc_ready') : context.tr('min_50_chars_req'),
              style: GoogleFonts.poppins(
                fontSize: 11,
                color: isDescValid ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                fontWeight: FontWeight.w500,
              ),
            ),
            Text(
              '$charCount / 50 ${context.tr('chars')}',
              style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF94A3B8)),
            ),
          ],
        ),
        const SizedBox(height: 20),

        // Category Selector Grid
        Text(context.tr('select_category'), style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _categories.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.05,
          ),
          itemBuilder: (ctx, idx) {
            final cat = _categories[idx];
            final catRawName = cat['name'] as String;
            final isSelected = _selectedCategory == catRawName;
            final catColor = cat['color'] as Color;

            return GestureDetector(
              onTap: () => setState(() => _selectedCategory = catRawName),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                decoration: BoxDecoration(
                  color: isSelected ? catColor.withValues(alpha: 0.1) : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected ? catColor : const Color(0xFFE2E8F0),
                    width: isSelected ? 2 : 1,
                  ),
                ),
                padding: const EdgeInsets.all(8),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(cat['icon'] as IconData, size: 24, color: isSelected ? catColor : const Color(0xFF64748B)),
                    const SizedBox(height: 6),
                    Text(
                      context.trCategory(catRawName),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                        color: isSelected ? catColor : const Color(0xFF334155),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  // STEP 2: Evidence
  Widget _buildStep2Evidence() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          context.tr('add_evidence'),
          style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
        ),
        const SizedBox(height: 4),
        Text(
          context.tr('upload_photos_support'),
          style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B)),
        ),
        const SizedBox(height: 20),

        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => _pickImage(ImageSource.camera),
                icon: const Icon(Icons.camera_alt_outlined, color: Colors.white, size: 18),
                label: Text(context.tr('camera'), style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: Colors.white)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _pickImage(ImageSource.gallery),
                icon: const Icon(Icons.photo_library_outlined, color: AppColors.primary, size: 18),
                label: Text(context.tr('gallery'), style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: AppColors.primary)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.primary),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        if (_images.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                const Icon(Icons.add_photo_alternate_outlined, size: 44, color: Color(0xFF94A3B8)),
                const SizedBox(height: 10),
                Text(context.tr('no_media_yet'), style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
                const SizedBox(height: 4),
                Text(context.tr('photos_help_verify'), style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF94A3B8))),
              ],
            ),
          )
        else ...[
          Text('${context.tr('selected_images')} (${_images.length})', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _images.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.0,
            ),
            itemBuilder: (ctx, i) {
              return Stack(
                fit: StackFit.expand,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image.file(File(_images[i].path), fit: BoxFit.cover),
                  ),
                  Positioned(
                    top: 4,
                    right: 4,
                    child: GestureDetector(
                      onTap: () => _removeImage(i),
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Colors.black54,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.close, size: 14, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ],
    );
  }

  // STEP 3: Location
  Widget _buildStep3Location() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          context.tr('confirm_location'),
          style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
        ),
        const SizedBox(height: 4),
        Text(
          context.tr('location_auto_mapped'),
          style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B)),
        ),
        const SizedBox(height: 20),

        // Live GPS Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: _currentPosition != null ? const Color(0xFF86EFAC) : const Color(0xFFE2E8F0)),
            boxShadow: const [
              BoxShadow(color: Color(0x08000000), blurRadius: 8, offset: Offset(0, 3)),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: _currentPosition != null ? const Color(0xFFF0FDF4) : const Color(0xFFFEF3C7),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.location_on,
                  color: _currentPosition != null ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _currentPosition != null ? context.tr('gps_captured') : context.tr('location_label'),
                      style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                    ),
                    Text(
                      _locationStatus,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Center(
          child: TextButton.icon(
            onPressed: _isFetchingLocation ? null : _fetchLocation,
            icon: _isFetchingLocation 
                ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
                : const Icon(Icons.refresh, size: 16, color: AppColors.primary),
            label: Text(
              _isFetchingLocation ? context.tr('refreshing') : context.tr('refresh_location'),
              style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Landmark Address
        Text(context.tr('landmark_optional'), style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
        const SizedBox(height: 6),
        TextField(
          controller: _addressController,
          style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF1E293B)),
          decoration: InputDecoration(
            hintText: context.tr('landmark_hint'),
            hintStyle: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF94A3B8)),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.primary)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
        ),
      ],
    );
  }
}
