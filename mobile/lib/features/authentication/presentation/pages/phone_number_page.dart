import 'package:flutter/material.dart';

import '../../../../core/localization/localization_extensions.dart';
import '../../../../design_system/design_system.dart';
import '../controllers/auth_controller.dart';
import '../../domain/entities/country_calling_code.dart';

class PhoneNumberPage extends StatelessWidget {
  const PhoneNumberPage({required this.controller, super.key});
  final AuthController controller;

  @override
  Widget build(BuildContext context) {
    final strings = context.l10n;
    final state = controller.state;
    return Scaffold(
      appBar: AppBar(
        leading: BackButton(onPressed: controller.showWelcome),
        title: Text(strings.appName),
      ),
      body: SafeArea(
        child: SaxlemResponsiveContent(
          child: ListView(
            padding: const EdgeInsetsDirectional.symmetric(
              vertical: SaxlemSpacing.three,
            ),
            children: [
              Text(
                strings.phoneTitle,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: SaxlemSpacing.one),
              Text(strings.phoneBody),
              const SizedBox(height: SaxlemSpacing.three),
              SaxlemCard(
                onTap: () => _selectCountry(context),
                semanticLabel: strings.country,
                child: Row(
                  children: [
                    const Icon(Icons.public_rounded),
                    const SizedBox(width: SaxlemSpacing.two),
                    Expanded(
                      child: Text(
                        '${controller.country.isoCode == 'IQ' ? strings.iraq : controller.country.isoCode}  ${controller.country.callingCode}',
                      ),
                    ),
                    const Icon(Icons.expand_more_rounded),
                  ],
                ),
              ),
              const SizedBox(height: SaxlemSpacing.two),
              SaxlemTextField(
                label: strings.phoneNumber,
                hint: strings.phoneHint,
                prefixText: '${controller.country.callingCode} ',
                autofocus: true,
                keyboardType: TextInputType.phone,
                textInputAction: TextInputAction.done,
                autofillHints: const [AutofillHints.telephoneNumberNational],
                enabled: !state.loading,
                errorText: state.errorCode == 'phone'
                    ? strings.phoneInvalid
                    : null,
                onChanged: controller.updatePhone,
                onSubmitted: (_) => controller.requestOtp(),
              ),
              if (state.errorCode == 'request') ...[
                const SizedBox(height: SaxlemSpacing.one),
                Text(
                  strings.authUnavailable,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ],
              const SizedBox(height: SaxlemSpacing.three),
              SaxlemButton(
                label: strings.sendCode,
                onPressed: controller.requestOtp,
                loading: state.loading,
                expand: true,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _selectCountry(BuildContext context) async {
    final selected = await showModalBottomSheet<CountryCallingCode>(
      context: context,
      builder: (context) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          children: supportedCallingCodes
              .map(
                (country) => ListTile(
                  minTileHeight: 56,
                  title: Text(country.isoCode),
                  trailing: Text(country.callingCode),
                  selected: country.isoCode == controller.country.isoCode,
                  onTap: () => Navigator.pop(context, country),
                ),
              )
              .toList(),
        ),
      ),
    );
    if (selected != null) controller.selectCountry(selected);
  }
}
