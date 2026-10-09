import { Teacher, Subject, Student, TeachingSchedule, InventoryItem } from '../types';
import { OFFICIAL_ASC_SCHEDULES } from './officialSchedules';
import { ALL_KELAS_8_DETAILS } from './kelas8StudentDetailsPart4';
import { ALL_KELAS_9_DETAILS } from './kelas9StudentDetailsPart3';

export const ALL_STUDENT_DETAILS: Partial<Student>[] = [
  ...ALL_KELAS_8_DETAILS,
  ...ALL_KELAS_9_DETAILS
];

export const INITIAL_TEACHERS: Teacher[] = [
  { id: 't-85780', name: 'M. Sholihin, SE', nip: '85780' },
  { id: 't-85781', name: 'Niarsih, S.Pd.I', nip: '85781' },
  { id: 't-85782', name: 'Saodah, S.Pd', nip: '85782' },
  { id: 't-85783', name: 'Lia Marlianty, S.Pd.I', nip: '85783' },
  { id: 't-85784', name: 'Dewi Sutrawati, SE', nip: '85784' },
  { id: 't-85785', name: 'Listijawati, SE', nip: '85785' },
  { id: 't-85786', name: 'Agustiani, S.Pd', nip: '85786' },
  { id: 't-85787', name: 'Nursiwan, S.Pd.I', nip: '85787' },
  { id: 't-85788', name: 'Sugiyono, S.Pd', nip: '85788' },
  { id: 't-85789', name: 'Anah, S.Pd', nip: '85789' },
  { id: 't-85790', name: 'Zakiah Tohir, S.Ag', nip: '85790' },
  { id: 't-85791', name: 'Indra Sofianis, S.Ag', nip: '85791' },
  { id: 't-85792', name: 'Isti Septiani, S.sos', nip: '85792' },
  { id: 't-85793', name: 'Maryani, S.Pd.I', nip: '85793' },
  { id: 't-85794', name: 'Kumainia, S.Pd.I', nip: '85794' },
  { id: 't-85795', name: 'Abdul Muits, S.Pd.I', nip: '85795' },
  { id: 't-85796', name: 'Tuti Tri Sevti, S.Pd', nip: '85796' },
  { id: 't-85797', name: 'Mujiningsih, S.Pd', nip: '85797' },
  { id: 't-85798', name: 'Erna Ekawati, SH', nip: '85798' },
  { id: 't-85799', name: 'Laili Nurhayati, S.Pd', nip: '85799' },
  { id: 't-85800', name: 'Maulana', nip: '85800' },
  { id: 't-85802', name: 'Syahrul Salam', nip: '85802' },
  { id: 't-85804', name: 'Akhmad Taufik', nip: '85804' },
  { id: 't-85805', name: 'Maulida, S.Pd', nip: '85805' },
  { id: 't-85821', name: 'Fahmi, S.Pd', nip: '85821' },
  { id: 't-85827', name: 'NASIM SUHERI, S.Pd', nip: '85827' },
  { id: 't-85829', name: 'Randi', nip: '85829' },
  { id: 't-85830', name: 'Malik', nip: '85830' },
  { id: 't-85831', name: 'Andri Setiawan', nip: '-' }
];

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sub-mtk', code: 'MTK', name: 'Matematika', category: 'Umum' },
  { id: 'sub-ipa', code: 'IPA', name: 'Ilmu Pengetahuan Alam', category: 'Umum' },
  { id: 'sub-eng', code: 'ENG', name: 'Bahasa Inggris (ENGLISH)', category: 'Umum' },
  { id: 'sub-bind', code: 'BIND', name: 'Bahasa Indonesia', category: 'Umum' },
  { id: 'sub-aqh', code: 'AQH', name: "Al-Qur'an Hadits", category: 'Umat' },
  { id: 'sub-bsund', code: 'BSUND', name: 'Bahasa Sunda', category: 'Lokal' },
  { id: 'sub-barab', code: 'BARAB', name: 'Bahasa Arab', category: 'Umat' },
  { id: 'sub-btq', code: 'BTQ', name: "Baca Tulis Al-Qur'an (BTQ)", category: 'Lokal' },
  { id: 'sub-ppkn', code: 'PPKN', name: 'Pancasila & Kewarganegaraan', category: 'Umum' },
  { id: 'sub-sbk', code: 'SBK', name: 'Seni Budaya & Keterampilan', category: 'Umum' },
  { id: 'sub-prky', code: 'PRKY', name: 'Prakarya', category: 'Umum' },
  { id: 'sub-ips', code: 'IPS', name: 'Ilmu Pengetahuan Sosial', category: 'Umum' },
  { id: 'sub-tik', code: 'TIK', name: 'Teknologi Informasi & Komunikasi', category: 'Umum' },
  { id: 'sub-fiqih', code: 'FIQIH', name: 'Fiqih', category: 'Umat' },
  { id: 'sub-penjas', code: 'PENJAS', name: 'Pendidikan Jasmani & Kesehatan', category: 'Umum' },
  { id: 'sub-supervisi', code: 'SUPERVISI', name: 'Supervisi Pembelajaran', category: 'Kedinasan' },
  { id: 'sub-aqidah', code: 'AQIDAH', name: 'Aqidah Akhlak', category: 'Umat' },
  { id: 'sub-ski', code: 'SKI', name: 'Sejarah Kebudayaan Islam (SKI)', category: 'Umat' }
];

export const CLASSES_LIST = [
  'VII A', 'VII B', 'VII C', 'VII D', 'VII E',
  'VIII A', 'VIII B', 'VIII C', 'VIII D', 'VIII E',
  'IX A', 'IX B', 'IX C', 'IX D', 'IX E', 'IX F'
];

export const RAW_STUDENT_DATA = `
IX A;1;ACHMAD FADLAN;A-2607001
IX A;2;ADITYA AWALUDIN;A-2607012
IX A;3;ADITYA SAPUTRA;A-2607023
IX A;4;AHMAD WILDAN;A-2607034
IX A;5;AL MUHAMMAD ARDIANSYAH PERKASA;A-2607045
IX A;6;AYU MAHARANI;A-2607056
IX A;7;BAGUS NURHADI YUDA;B-2607067
IX A;8;CINTA HIJRANIA MECCA;C-2607078
IX A;9;EVAN SYAHIRUL ALIM;E-2607089
IX A;10;M. ILHAM;M-2607019
IX A;11;MUHAMAD RIZKY MAULANA;M-2617011
IX A;12;MUHAMMAD ALIF;M-2617112
IX A;13;MUHAMMAD DZAKI JAABIR;M-2617213
IX A;14;MUHAMMAD RIDHO;M-2617314
IX A;15;MUHAMMAD SATRIO DINNUR;M-2617415
IX A;16;NAJWA MIKAELA MAHARANI;N-2617516
IX A;17;NAURA YASMIN ZAFARANI;N-2617617
IX A;18;NAYLA RIZKY AMANDA PUTRI;N-2617718
IX A;19;RASTY ANASTASYANA;R-2617819
IX A;20;RENALDI RAMADHANI;R-2607129
IX A;21;RIFKI RAMADHAN;R-2627021
IX A;22;SAVIRA FITRIANA;S-2627122
IX A;23;SYARIFAH NAZLI;S-2627223
IX A;24;ZAHRA NUR SEPTIARINI;Z-2627324
IX A;25;ZANNETA CHANDRA KIRANA;Z-2627425
IX B;1;ADEN PERTAMA;A-2627526
IX B;2;ADINDA THERESIA;A-2627627
IX B;3;AINI ZAHIRA HASANAH;A-2627728
IX B;4;ALFARABBI RABBANA;A-2627829
IX B;5;ALVIANSYAH;A-2607239
IX B;6;ANGGI KEYSA YULISTIA;A-2637031
IX B;7;ARMAN MAULANA;A-2637132
IX B;8;DELLVIA ZAHRA;D-2637233
IX B;9;DESTIA SALSABILA;D-2637334
IX B;10;DZIKRA OKTAVIANA;D-2637435
IX B;11;FAREL RADITYA;F-2637536
IX B;12;GILANG SAIR MUHARAM;G-2637637
IX B;13;HANIFA KARTIKA SARI;H-2637738
IX B;14;HANNA SYAKILLAH;H-2637839
IX B;15;IKBAL SAPUTRA;I-2607349
IX B;16;INAYAH MUSFIFAH;I-2647041
IX B;17;KAYLA PUTRI;K-2647142
IX B;18;M.FIKRAR YAZIN;M-2647243
IX B;19;MUHAMAD AZAM AL RIFKI;M-2647344
IX B;20;MUHAMAD EZRIL PADILLAH;M-2647445
IX B;21;MUHAMAD FAHRI;M-2647546
IX B;22;MUHAMMAD ENGGAR PRASETYO;M-2647647
IX B;23;MUHAMMAD FADLI SYAHREZA;M-2647748
IX B;24;MUHAMMAD HAIKAL ADNAN ALZAM;M-2647849
IX B;25;RAIHAN FIKRI;R-2607459
IX B;26;REISYA SYAHRAN ADAM;R-2657051
IX B;27;RIZQI PUTRA IRAWAN;R-2657152
IX B;28;TALITA NAJAH RANIA;T-2657253
IX B;29;WIDYANI DWI AGUSTINA;W-2657354
IX B;30;ZIDAN ILHAM PAUJI;Z-2657455
IX C;1;ADI FIRMANSYAH;A-2657556
IX C;2;AKBAR FATTAHRUL AWWAL;A-2657657
IX C;3;ALFA RIZKI NURDIN;A-2657758
IX C;4;AMELIA SEPTIANI ROMANSYAH;A-2657859
IX C;5;ANDI IZELLAH NUR SAFANA;A-2607569
IX C;6;ANISSA APRIANI;A-2667061
IX C;7;ANITA LAELATUL QHUSNA;A-2667162
IX C;8;ARINA TALITA ELFARRAS;A-2667263
IX C;9;ARYA ADE PUTRA;A-2667364
IX C;10;AYU ROHMANU BIHAQI;A-2667465
IX C;11;FARHAT PUTRA KUSUMAH;F-2667566
IX C;12;HIDATUNNISA;H-2667667
IX C;13;IBHAM FAJAR RAMADHAN;I-2667768
IX C;14;INAYAH AKILA;I-2667869
IX C;15;KANAYA PUTRI RAMADHANIS;K-2607679
IX C;16;KENZIE ALFARIZQI FARDIAN;K-2677071
IX C;17;KHANZA KHUMAIRAH;K-2677172
IX C;18;LUTFIANI RAUDHAH ELFIRDAUSY;L-2677273
IX C;19;M. IBNU KHAFI;M-2677374
IX C;20;MAULID MICHKO FEBRIAN;M-2677475
IX C;21;MUFID NUR LABIB;M-2677576
IX C;22;MUHAMMAD AKBAR BACHTIAR;M-2677677
IX C;23;RANI QANITAH;R-2677778
IX C;24;RAYYA AYU WARDHANI;R-2677879
IX C;25;SEPTIA AGUSTIN;S-2607789
IX C;26;SRI ANJAR YANI;S-2687081
IX C;27;VIRNIE AL ZAQIA;V-2687182
IX C;28;ZAHRATUL AZIZAH;Z-2687283
IX C;29;ZAIDAN HAQI PRIYATNA;Z-2687384
IX C;30;ZHAHIR AR-RAZZAQ FIRDAUS;Z-2687485
IX D;1;ABDUL RASYID;A-2687586
IX D;2;ARYA WIRAKUSUMA;A-2687687
IX D;3;ASYA SYARA AGUSTINA;A-2687788
IX D;4;AURELIA AGUSTINA RAMADHANI;A-2687889
IX D;5;DAVA ANDIKA RACHMAN;D-2607899
IX D;6;FARAH LIA AZZAHRA ;F-2697091
IX D;7;FAZRIEL WINDRAWAN;F-2697192
IX D;8;KANAYA RAHMAN;K-2697293
IX D;9;LILLA URMILA;L-2697394
IX D;10;MARWAH JULIANTI;M-2697495
IX D;11;MUHAMAD ANUGRAH;M-2697596
IX D;12;MUHAMAD IQBAL MA'ARIF;M-2697697
IX D;13;MUHAMMAD AMR AL FARUQ;M-2697798
IX D;14;MUHAMMAD FADLI  AL BIAN;M-2697899
IX D;15;MUHAMMAD FATHIR AMRI;M-2607199
IX D;16;MUHAMMAD RIZKY;M-26107101
IX D;17;NADIA PUTRI;N-26107112
IX D;18;NAZWA SYAFWA SURYANA;N-26107123
IX D;19;NUR AL ISRAH SUWANDI;N-26107134
IX D;20;QIERRA HARISHA NAFILLA;Q-26107145
IX D;21;RAFFI ANANDA;R-26107156
IX D;22;RAKADITYA SEPTIANSYAH;R-26107167
IX D;23;RAMA TEGUH ERLANGGA;R-26107178
IX D;24;RAZKA RAMADHAN GEMILANG;R-26107189
IX D;25;RESTU DWI ALFIQRI;R-26107119
IX D;26;REVITA DWI AMARTA;R-261107111
IX D;27;RIFKY FEBRIAN MAULIDAN;R-261117112
IX D;28;SITI NUR NABILA;S-261127113
IX D;29;SITI ROHILYA AZZAHRA;S-261137114
IX D;30;VANYA AQILLA JASMINE;V-261147115
IX D;31;YOUSAF AMAR ZAMZAMI ACHIR;Y-261157116
IX E;1;AIMAR DZAKARAQI;A-261167117
IX E;2;AMIRATUL HASNA;A-261177118
IX E;3;ANISA SAFANA;A-261187119
IX E;4;ASYIFA SALSABILA;A-26117129
IX E;5;AZRIEL NUR ILHAM;A-261207121
IX E;6;BILQIST ZAHIRA RAMADHANI;B-261217122
IX E;7;DAFA RAMADHAN AL-AYUBI ;D-261227123
IX E;8;DESTYA NURMALASARI;D-261237124
IX E;9;FATIMAH AZZAHRA;F-261247125
IX E;10;HARI PURNOMO;H-261257126
IX E;11;KEYZA AZZAHRA SULAEMAN;K-261267127
IX E;12;MOHAMAD KHAIRUL ANWAR;M-261277128
IX E;13;MUHAMAD HAIKAL;M-261287129
IX E;14;MUHAMMAD FACHRURROZI ISHAQ;M-26127139
IX E;15;MUHAMMAD FAIZ DZAL AIDI;M-261307131
IX E;16;MUHAMMAD KHADAFY ALFINO;M-261317132
IX E;17;MUHAMMAD ZIDANE AL PARIZY;M-261327133
IX E;18;NABILA ANGGRAINI;N-261337134
IX E;19;NAJLA QALISSA;N-261347135
IX E;20;RAMADHAN PUTRA PLAWIRA;R-261357136
IX E;21;RAMON OKTA SETIAWAN;R-261367137
IX E;22;RAYSHA PUTRI FIRANSYAH;R-261377138
IX E;23;RIZKI DARMAWAN;R-261387139
IX E;24;SEPTA GALIH PUTRA;S-26137149
IX E;25;SITI JULIANA;S-261407141
IX E;26;SUCI ANGGRAINI;S-261417142
IX E;27;ZAHRA ASYIFA;Z-261427143
IX F;1;ABDUL RASYID;A-261437144
IX F;2;AFIKA SOFI YANTI;A-261447145
IX F;3;AISYAH;A-261457146
IX F;4;BOY SAPUTRA JAYA;B-261467147
IX F;5;DEWINTA SALSA BILLA;D-261477148
IX F;6;DHEANOV NABILA AZZAHRA;D-261487149
IX F;7;FAHMI FABIAN YUSUF;F-26147159
IX F;8;FAJAR M.;F-261507151
IX F;9;HAIKAL ALVARIZI;H-261517152
IX F;10;IKRAR ALO;I-261527153
IX F;11;IRSYAD ZAINUL MUTTAQIN;I-261537154
IX F;12;KHEYSA PUTRI SANTOSO;K-261547155
IX F;13;MALKA MAULANA DANIYAH;M-261557156
IX F;14;MEISYA ZHAFIRA AL ROCHSYID;M-261567157
IX F;15;MUHAMAD RAFA;M-261577158
IX F;16;MUHAMAD REYHAN SYAPUTRA;M-261587159
IX F;17;MUHAMMAD AL HAFIDZ;M-26157169
IX F;18;MUHAMMAD ALFARIZI;M-261607161
IX F;19;MUHAMMAD FADLI;M-261617162
IX F;20;MUHAMMAD FAZRYANSYAH;M-261627163
IX F;21;NABILA NUR ALIKA;N-261637164
IX F;22;NATHASYA PUTRI PRATAMA;N-261647165
IX F;23;PUTRI GHEISHA;P-261657166
IX F;24;RADITIA ALVARO;R-261667167
IX F;25;RAFGI AKMAL EL-AZZAM;R-261677168
IX F;26;RUBY ALKAFIANI ZAHRA;R-261687169
IX F;27;SYAFITA JULIANA;S-26167179
IX F;28;SYAFRINA MAZAYA ARSYAD;S-261707171
IX F;29;TAHARA DIANDRA;T-261717172
VII A;1;Afisah Nayla  ;A-261727173
VII A;2;Ahmad Nizam Muharam ;A-261737174
VII A;3;Aldi Kosasih ;A-261747175
VII A;4;Aqila Ramadhani  ;A-261757176
VII A;5;Arfa Muhammad Atthaya;A-261767177
VII A;6;Arya Nugraha  ;A-261777178
VII A;7;Ashika Saffa ;A-261787179
VII A;8;Dimas Alfiand Ramadhan ;D-26177189
VII A;9;Dinda Destiana Putri;D-261807181
VII A;10;Dzulva Arvanzaky;D-261817182
VII A;11;Fahdanar ;F-261827183
VII A;12;FARIDZ ABDUL MALIK ;F-261837184
VII A;13;Hanafi Zukri Hadi ;H-261847185
VII A;14;Keisya Adelia ;K-261857186
VII A;15;Khayira Ibnati G.W  ;K-261867187
VII A;16;M. Aldi Nur Rizki ;M-261877188
VII A;17;M. Devin Alfauzan ;M-261887189
VII A;18;Muhammad Alfiansyah;M-26187199
VII A;19;MUHAMMAD AZKA AL RAFA;M-261907191
VII A;20;Nabilla Febriani ;N-261917192
VII A;21;Nurul Aini  ;N-261927193
VII A;22;PANDU JULIAN  ;P-261937194
VII A;23;Qhanaya Harisha Aishabriya;Q-261947195
VII A;24;Shava Wardana;S-261957196
VII A;25;Shifa Maulida Putri Yunda ;S-261967197
VII A;26;Siti Nur Rahmah  ;S-261977198
VII A;27;Valia Rahmanisa ;V-261987199
VII A;28;Viska Anastasya ;V-2617299
VII A;29;Zierly Rossiana Alifha  ;Z-26207201
VII B;1;Abrar Azizi Lutfi;A-26207212
VII B;2;Adrian Maulana ;A-26207223
VII B;3;Ahmad Fadhil Dermawan ;A-26207234
VII B;4;Alvianty Azzalea  ;A-26207245
VII B;5;Aqilla Savitri  ;A-26207256
VII B;6;Arfa Lazuardi;A-26207267
VII B;7;Asep Saepudin  ;A-26207278
VII B;8;Astri Mauludya  ;A-26207289
VII B;9;Edwin Master Regional  ;E-26207219
VII B;10;Faqih Hafizh Ramadhan ;F-262107211
VII B;11;Farcello Ibrahimmovic ;F-262117212
VII B;12;Gufron Bayu Wijaya ;G-262127213
VII B;13;Habibie Azzikra Putra;H-262137214
VII B;14;Kiandra Azeeva ;K-262147215
VII B;15;Kiaryuda ;K-262157216
VII B;16;M. Aska Asdiansyah;M-262167217
VII B;17;Muhammad Fadlan Ramadhan ;M-262177218
VII B;18;Muhammad Ridwan;M-262187219
VII B;19;Muhammad Wildan Abdurrahman ;M-26217229
VII B;20;Natasya Aprillia Ramdani ;N-262207221
VII B;21;Natazia Mulyana Sari ;N-262217222
VII B;22;Putri Aisah ;P-262227223
VII B;23;R Aurelia Putri Anindhita Utami ;R-262237224
VII B;24;Rangga Pramana Putra;R-262247225
VII B;25;Septian Al Ayubi ;S-262257226
VII B;26;Shofiyya;S-262267227
VII B;27;Yasmin Aulia Diandra ;Y-262277228
VII C;2;Aditya Febriansyah ;A-262287229
VII C;3;Al Ghazali Tsaqib Putra Rianka ;A-26227239
VII C;1;Albi Yansyah;A-262307231
VII C;4;Aldian Mahar Dika ;A-262317232
VII C;5;Alisa Khoerunnisa ;A-262327233
VII C;6;Alyana Salasabilah;A-262337234
VII C;7;Arga Saputra  ;A-262347235
VII C;8;Asha Aqillah Jaen ;A-262357236
VII C;9;Danish Safwan  ;D-262367237
VII C;10;Dzakwan Alfarius Saputra ;D-262377238
VII C;11;Farhan Tri Kusumah  ;F-262387239
VII C;12;Julia Safitri ;J-26237249
VII C;13;Juwennika R;J-262407241
VII C;14;Kayla Adila Putri  ;K-262417242
VII C;15;M.Achsan Fadhillah ;M-262427243
VII C;16;Mikayla Afia Najah Darmawan  ;M-262437244
VII C;17;Muhamad Fahmi;M-262447245
VII C;18;Muhammad Bayu Syahidan ;M-262457246
VII C;19;Muhammad Firza Sabil;M-262467247
VII C;20;Orly Zulfikar Kusuma ;O-262477248
VII C;21;Rafa Syahputra;R-262487249
VII C;22;Safira Zakia Putri;S-26247259
VII C;23;Salma Razana;S-262507251
VII C;24;Salwa Agustina;S-262517252
VII C;25;Siti Sarah  ;S-262527253
VII C;26;Suniyya Rana Putri ;S-262537254
VII C;27;Ulfiah Dwi Azzahra ;U-262547255
VII D;1;Abdul Fauzan;A-262557256
VII D;2;Abizar Kurniawan;A-262567257
VII D;3;Annisa Wardhana ;A-262577258
VII D;4;Daffa Saputra;D-262587259
VII D;5;Fajar Maulana Ibrahim ;F-26257269
VII D;6;Haidar Mutadjib ;H-262607261
VII D;7;Inayah Ulfiatul Nisa ;I-262617262
VII D;8;Jihan Aqila;J-262627263
VII D;9;Maulidia Indriani;M-262637264
VII D;10;Muhammad Abizar Maulana;M-262647265
VII D;11;Muhammad Adni;M-262657266
VII D;12;Muhammad Ariq Rifid Alfatih;M-262667267
VII D;13;Muhammad Azka Halviansyah ;M-262677268
VII D;14;Muhammad Azril Ilham;M-262687269
VII D;15;Muhammad Ibnu Aqil;M-26267279
VII D;16;Muhammad Padly ;M-262707271
VII D;17;Muhammad Syahputra ;M-262717272
VII D;18;Nada Riani Syarif ;N-262727273
VII D;19;Putri Cahya Ningrum;P-262737274
VII D;20;Putri Jelita Oktviani;P-262747275
VII D;21;Rifkie Mahardika ;R-262757276
VII D;22;Riska Oktaviani;R-262767277
VII D;23;Sera Azwa Sultan  ;S-262777278
VII D;24;Shidqii Bintang Rachmawati;S-262787279
VII D;25;Tamashii Anding ;T-26277289
VII E;3;Abdul Rashid Salim Rangkuti ;A-262807281
VII E;4;Adam Abdussalam ;A-262817282
VII E;1;Aira Hamidah Suhari  ;A-262827283
VII E;5;Anita Lestari;A-262837284
VII E;6;Bunga Aqila;B-262847285
VII E;2;Daniela Eugenia Arief;D-262857286
VII E;7;Ereyhan Ruhbanullah Ikerlan ;E-262867287
VII E;8;Erlangga Syahputra  ;E-262877288
VII E;9;Febbyolah;F-262887289
VII E;10;Febri Yani  ;F-26287299
VII E;11;Gina Nathasya Romadhona ;G-262907291
VII E;12;Humam Faaiz Arrasyid ;H-262917292
VII E;13;Keisha Adelia  ;K-262927293
VII E;14;Mirza Habib Muhammad ;M-262937294
VII E;15;Muhamad Ferdiansyah;M-262947295
VII E;16;Muhammad Adrian Maulana Fajari  ;M-262957296
VII E;17;Muhammad Zidan ;M-262967297
VII E;18;Muhaymin ;M-262977298
VII E;19;Nova Riani ;N-262987299
VII E;20;Rafa Al Ghazali  ;R-2627399
VII E;21;Rasyid Imamul Hakim ;R-26307301
VII E;22;Rezan Maulana ;R-26307312
VII E;23;Siti Alifia Sizear ;S-26307323
VII E;24;Sultan Arkhan Abdillah ;S-26307334
VII E;25;Tivany Febrida R;T-26307345
VIII A;1;ARMAN SYAH RAMADAN;A-26307356
VIII A;2;ASIFA PINAN JEPRINA;A-26307367
VIII A;3;CANTIKA PERMATA JEPRINA;C-26307378
VIII A;4;DARMAJI;D-26307389
VIII A;5;DILLA RAISYAH;D-26307319
VIII A;6;ERNAWATI ;E-263107311
VIII A;7;FARAH RIZQIA HARDIANSYAH;F-263117312
VIII A;8;FERI JUANSAH;F-263127313
VIII A;9;FIRA OCTAVIA;F-263137314
VIII A;10;FITYA  PRATISHA;F-263147315
VIII A;11;GIVEN RAMADHAN PUTRA YULIANTO ;G-263157316
VIII A;12;JAHIRAH NUR'AINI;J-263167317
VIII A;13;MOHAMMAD YUSUP ZAENURI;M-263177318
VIII A;14;MUHAMAD DALLIF;M-263187319
VIII A;16;MUHAMMAD IQBAL;M-26317329
VIII A;15;MUHAMMAD IRFAN SAPUTRA;M-263207321
VIII A;17;MUHAMMAD KHOIRUN NIZAM;M-263217322
VIII A;18;MUTIARA HAKIKI;M-263227323
VIII A;19;NASYA;N-263237324
VIII A;20;NAYA SEPTIANI PUTRI;N-263247325
VIII A;21;NAYLA PUTRI MAILIA;N-263257326
VIII A;22;NINDY NOVALIA ASTUTY;N-263267327
VIII A;23;NURUL SALSA BILA;N-263277328
VIII A;24;PUTRI RIZKI RAMADANI;P-263287329
VIII A;25;RENITA BERLIAN WAFA TSARWAH;R-26327339
VIII A;26;ROHAYA;R-263307331
VIII A;27;SERLI APRILIA JASMIN;S-263317332
VIII A;28;SITI MUTIA PUTRY INDRIANI;S-263327333
VIII A;29;SITI RUBY KHUMAIRA;S-263337334
VIII A;30;TASYA AFRILIA;T-263347335
VIII A;31;WAFA SYAKIRA MAULIDYA;W-263357336
VIII A;32;YOGI RAMDANI;Y-263367337
VIII A;33;YUDIS ARIZKYA PRATAMA;Y-263377338
VIII A;34;ZAHRA AURELLIA;Z-263387339
VIII A;35;ZIHAN RAHMA HAMIDAH;Z-26337349
VIII B;1;AHMAD FATONI AL-AMIN;A-263407341
VIII B;2;AHMALIA KHOERUNNISA;A-263417342
VIII B;3;AIN MAULANA;A-263427343
VIII B;4;ASYIFAH SYEHLENA FITRI;A-263437344
VIII B;5;ATHIFAH VIRLIA;A-263447345
VIII B;6;DAFA NAFIS MUAZAM;D-263457346
VIII B;7;DHISTI NAURA ANJANI;D-263467347
VIII B;8;EGI APRIANSYAH;E-263477348
VIII B;9;FABIAN ARKAN ADINATA;F-263487349
VIII B;10;FAUZAN AGUSTIAN ;F-26347359
VIII B;11;FAUZAN PRAYOGA;F-263507351
VIII B;12;FEBRIANSYAH;F-263517352
VIII B;13;GALANG FEBRIANO;G-263527353
VIII B;14;GISELA PUTRI;G-263537354
VIII B;15;KHOIRUNISSA;K-263547355
VIII B;16;KIRANI SASKIA RAMADHANIA ;K-263557356
VIII B;17;KIREINA LULU MUTMAINAH;K-263567357
VIII B;18;MUHAMAD HAYKAL RAMADHAN;M-263577358
VIII B;19;MUHAMAD ICAL FAHRI;M-263587359
VIII B;20;MUHAMMAD ADITYA RAMADHAN;M-26357369
VIII B;21;MUHAMMAD BINTANG RAMADHAN;M-263607361
VIII B;22;MUHAMMAD NUR FADILLAH;M-263617362
VIII B;23;MUHAMMAD SATRIA AL'FARAZ;M-263627363
VIII B;24;REVAN HAKIKI ;R-263637364
VIII B;25;RIFQI FAHRIZAM;R-263647365
VIII B;26;RUSLAN ALDIYANSYAH;R-263657366
VIII B;27;SABILA AULIA;S-263667367
VIII B;28;SITI SYAKIRA BAHRI;S-263677368
VIII B;29;SRI PUTRI RAHAYU;S-263687369
VIII B;30;SYAHDA AMELIA PUTRI;S-26367379
VIII B;31;YOGI PRATAMA;Y-263707371
VIII C;1;ABDUL WAHHAB;A-263717372
VIII C;2;ADINDA PURNAMA SARI;A-263727373
VIII C;3;AIKO PUTRI UTAMI DAMAYANTI;A-263737374
VIII C;4;ALBI KHAIRUL NIJAM;A-263747375
VIII C;5;ALYA MARSYA QISTINA ZARA;A-263757376
VIII C;6;ANDIN PUTRI YAHYA;A-263767377
VIII C;7;ARDA FIRLLY;A-263777378
VIII C;8;ARKAN ADZAKHWAN ALBIANSYAH;A-263787379
VIII C;9;CITYEL FATIMAH KHELA NATASYA;C-26377389
VIII C;10;DEVIYANTI;D-263807381
VIII C;11;FADEL MOHAMMAD DEVIRZHA;F-263817382
VIII C;12;FAKHRI NAILUL KHAIR ANNABIH;F-263827383
VIII C;13;FICO DWINOVIAN ADITYA;F-263837384
VIII C;14;GIVARELL ALVERO YUDISTIRA;G-263847385
VIII C;15;HANABI ALKHAIRI;H-263857386
VIII C;16;JAHIRA PUTRI KINARA;J-263867387
VIII C;17;MUHAMAD FAISAL SHIHAB;M-263877388
VIII C;18;MEISILA HOLIDINA;M-263887389
VIII C;19;MUHAMAD ADJIE FIRMANSYAH;M-26387399
VIII C;20;MUHAMAD RIZKI FADILAH;M-263907391
VIII C;21;MUHAMMAD ALIF AL HAKIM;M-263917392
VIII C;22;MUTIYARA DESWITA;M-263927393
VIII C;23;NAISYA RIBIA ARIF;N-263937394
VIII C;24;NAKA DAMIEL;N-263947395
VIII C;25;RADEN ABDUL MUHYI;R-263957396
VIII C;26;RADYA NADIN;R-263967397
VIII C;27;SABILAHTUL MARYAM;S-263977398
VIII C;28;SYAFIQ AL - FANWAR;S-263987399
VIII C;29;TANIA AFRIANI PUTRI;T-2637499
VIII C;30;ZEVANO ARIFIN MS;Z-26407401
VIII D;1;ADINDA RAMADHANI;A-26407423
VIII D;2;ABDUL MUGNI;A-26407412
VIII D;3;ALESHA NAJLAA RAMADHANI;A-26407434
VIII D;4;ANGGITA SILVIANA;A-26407445
VIII D;5;AZKA PERMANA;A-26407456
VIII D;6;CANTIKA PUSPA HERDIANI;C-26407467
VIII D;7;HAIRUL AZAM RAMDANI;H-26407478
VIII D;8;HISYAM DWI RABBANI;H-26407489
VIII D;9;INAYAH MAULIDYA;I-26407419
VIII D;10;KELVIN NUR YAHYA PERATAMA;K-264107411
VIII D;11;M RIFKY JUNIANSYAH GUTAMA;M-264117412
VIII D;12;MAYWA DINAHRA;M-264127413
VIII D;13;MEIDA AULIA TRIDINA;M-264137414
VIII D;14;MUHAMMAD EKA SAPUTRA;M-264147415
VIII D;15;MUHAMMAD NABILLY SYAHDAN;M-264157416
VIII D;16;MUHAMMAD RIZKY HAFIDZ NUGRAHA;M-264167417
VIII D;17;MUHAMMAD ZULQIAN LUBIS;M-264177418
VIII D;18;NADYA AGUSTINE;N-264187419
VIII D;19;NELY LUSIANI;N-26417429
VIII D;20;NUR ALIKA ISMIYANTI;N-264207421
VIII D;21;RAFAEL SYAHPUTRA P;R-264217422
VIII D;22;RATU ARIMBITAGAWA SOETIARSO;R-264227423
VIII D;23;RIZA TRI SAPUTRA;R-264237424
VIII D;24;RIZKY KURNIAWAN;R-264247425
VIII D;25;SANWA AZZAHRA PUTRI;S-264257426
VIII D;26;SILFA RYANI;S-264267427
VIII D;27;SIREN FEBRYANI;S-264277428
VIII D;28;SITI ZAHWA SIFALIYAH;S-264287429
VIII D;29;USWAHTUN AZIZAH;U-26427439
VIII D;30;YUSUF ZAMZAMI;Y-264307431
VIII D;31;ZASKIA KIRANA PUTRI;Z-264317432
VIII E;1;AAY WIBAWA;A-264327433
VIII E;2;AHMAD FAUZAN;A-264337434
VIII E;3;BUNGA CITRA LESTARI;B-264347435
VIII E;4;CAHYA MAULIDA FLOWIEN;C-264357436
VIII E;5;CELVINO AZKA FABIAN;C-264367437
VIII E;6;DAVINA ANGGRAENI;D-264377438
VIII E;7;ELMIKO ATHAREZKA CALIEF;E-264387439
VIII E;8;ERLINA PUTRI;E-26437449
VIII E;9;FARHAN AKBAR RAMADHAN;F-264407441
VIII E;10;HABIBATUS SYADIYAH;H-264417442
VIII E;11;KEYSHA ANATASYA RAMADHAN;K-264427443
VIII E;12;KINARA PUTRI HUMAIRA;K-264437444
VIII E;13;MIA ANANDA;M-264447445
VIII E;14;MISBAH MAULANA PUTRA;M-264457446
VIII E;15;MUHAMAD FACHRI;M-264467447
VIII E;16;MUHAMAD HAIKAL AL BAHSYIR;M-264477448
VIII E;17;MUHAMMAD IQBAL;M-264487449
VIII E;18;MUHAMAD RAFFA AL-HASBI;M-26447459
VIII E;19;MUHAMMAD FAHRI RASYID AL MULK;M-264507451
VIII E;20;MUHAMMAD FAQIH DAMINI;M-264517452
VIII E;21;MUHAMMAD HAIKAL ELSHARAWY;M-264527453
VIII E;22;MUHAMMAD RAFFA;M-264537454
VIII E;23;MUHAMMAD RAFFI AL-HASBI;M-264547455
VIII E;24;REFANDI DWI SAPUTRA;R-264557456
VIII E;25;RIZKY MAULANA ADITYA;R-264567457
VIII E;26;SABRINA AQILA RAHADATUL AISY;S-264577458
VIII E;27;SALMA;S-264587459
VIII E;28;SALWA;S-26457469
VIII E;29;SIFA RAMADHANI;S-264607461
VIII E;30;TASYA AULIA;T-264617462
VIII E;31;YASMIN KHOIRUNISA;Y-264627463
`;

export function parseStudents(): Student[] {
  const lines = RAW_STUDENT_DATA.trim().split('\n');
  const students: Student[] = [];
  const existingIds = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.toLowerCase().startsWith('kelas')) continue;

    let className = '';
    let rollNo = i + 1;
    let name = '';
    let kodeUnik: string | undefined = undefined;

    if (line.includes(';')) {
      const parts = line.split(';').map(p => p.trim());
      if (parts.length >= 3) {
        className = parts[0];
        rollNo = parseInt(parts[1], 10) || (i + 1);
        name = parts[2];
        kodeUnik = parts[3] || undefined;
      }
    } else {
      const match = line.match(/^([V|I|X]+ [A-Z]) (\d+) (.+)$/);
      if (match) {
        className = match[1].trim();
        rollNo = parseInt(match[2], 10);
        name = match[3].trim();
      }
    }

    if (className && name) {
      let baseId = `stu-${className.replace(/\s+/g, '')}-${rollNo}`;
      let id = baseId;
      if (existingIds.has(id)) {
        id = kodeUnik ? `stu-${kodeUnik}` : `${baseId}-${i + 1}`;
      }
      if (existingIds.has(id)) {
        id = `stu-${className.replace(/\s+/g, '')}-${i + 1}`;
      }
      existingIds.add(id);

      // Find matching detail from ALL_STUDENT_DETAILS (Kelas 8 + Kelas 9)
      const normalizedName = name.toLowerCase().replace(/['"`.,\-]/g, ' ').replace(/\s+/g, ' ').trim();
      const normClass = className.toUpperCase().replace(/\s+/g, '');
      const detailMatch = ALL_STUDENT_DETAILS.find(d => {
        const dNormName = (d.name || '').toLowerCase().replace(/['"`.,\-]/g, ' ').replace(/\s+/g, ' ').trim();
        const dNormClass = (d.className || '').toUpperCase().replace(/\s+/g, '');
        return (dNormName === normalizedName || dNormName.includes(normalizedName) || normalizedName.includes(dNormName)) &&
               (dNormClass === normClass || !dNormClass);
      });

      students.push({
        id,
        className,
        rollNo,
        name,
        kodeUnik,
        ...(detailMatch ? detailMatch : {})
      });
    }
  }

  // Also include any students in ALL_STUDENT_DETAILS that are not in RAW_STUDENT_DATA (e.g. Aktif Tanpa Rombel)
  ALL_STUDENT_DETAILS.forEach((extraDetail, idx) => {
    if (!extraDetail.name) return;
    const extraNormName = extraDetail.name.toLowerCase().replace(/['"`.,\-]/g, ' ').replace(/\s+/g, ' ').trim();
    const alreadyExists = students.some(s => s.name.toLowerCase().replace(/['"`.,\-]/g, ' ').replace(/\s+/g, ' ').trim() === extraNormName);
    if (!alreadyExists) {
      const cls = extraDetail.className || 'IX A';
      const id = `stu-extra-${cls.replace(/\s+/g, '')}-${idx + 1}`;
      students.push({
        id,
        className: cls,
        rollNo: students.filter(s => s.className === cls).length + 1,
        name: extraDetail.name,
        ...extraDetail
      } as Student);
    }
  });

  return students;
}

export const INITIAL_STUDENTS: Student[] = parseStudents();

export const DAYS_OF_WEEK: ('Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu')[] = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu'
];

export const STANDARD_SCHEDULE_PERIODS = [
  { id: '1-2', label: 'Jam 1 - 2 (07.15 - 08.25 WIB)', time: '07.15 - 08.25', hours: [1, 2] },
  { id: '3-4', label: 'Jam 3 - 4 (08.25 - 09.35 WIB)', time: '08.25 - 09.35', hours: [3, 4] },
  { id: '5-6', label: 'Jam 5 - 6 (09.55 - 11.05 WIB)', time: '09.55 - 11.05', hours: [5, 6] },
  { id: '7-8', label: 'Jam 7 - 8 (11.05 - 12.15 WIB)', time: '11.05 - 12.15', hours: [7, 8] },
  { id: '1', label: 'Jam 1 (07.15 - 07.50 WIB)', time: '07.15 - 07.50', hours: [1] },
  { id: '2', label: 'Jam 2 (07.50 - 08.25 WIB)', time: '07.50 - 08.25', hours: [2] },
  { id: '3', label: 'Jam 3 (08.25 - 09.00 WIB)', time: '08.25 - 09.00', hours: [3] },
  { id: '4', label: 'Jam 4 (09.00 - 09.35 WIB)', time: '09.00 - 09.35', hours: [4] },
  { id: '5', label: 'Jam 5 (09.55 - 10.30 WIB)', time: '09.55 - 10.30', hours: [5] },
  { id: '6', label: 'Jam 6 (10.30 - 11.05 WIB)', time: '10.30 - 11.05', hours: [6] },
  { id: '7', label: 'Jam 7 (11.05 - 11.40 WIB)', time: '11.05 - 11.40', hours: [7] },
  { id: '8', label: 'Jam 8 (11.40 - 12.15 WIB)', time: '11.40 - 12.15', hours: [8] }
];

export const INITIAL_SCHEDULES: TeachingSchedule[] = OFFICIAL_ASC_SCHEDULES;

export const INITIAL_INVENTORY_ITEMS: InventoryItem[] = [
  // 1. SERAGAM (Baju Olahraga, Baju Kotak, Rok Kotak, Almamater, Baju Jurusan, Baju Khas, Baju Batik, Baju Muslim)
  // Baju Olahraga
  { id: 'inv-srg-olr-s', itemCode: 'SRG-OLR-S', category: 'SERAGAM', variantType: 'Baju Olahraga', name: 'Baju Olahraga (Ukuran S)', size: 'S', gradeLevel: 'SEMUA', unitPrice: 150000, currentStock: 25, minStockAlert: 5, totalSold: 12, totalRestocked: 37, description: 'Setelan Kaos & Celana Olahraga Madrasah Ukuran S', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-olr-m', itemCode: 'SRG-OLR-M', category: 'SERAGAM', variantType: 'Baju Olahraga', name: 'Baju Olahraga (Ukuran M)', size: 'M', gradeLevel: 'SEMUA', unitPrice: 150000, currentStock: 30, minStockAlert: 5, totalSold: 15, totalRestocked: 45, description: 'Setelan Kaos & Celana Olahraga Madrasah Ukuran M', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-olr-l', itemCode: 'SRG-OLR-L', category: 'SERAGAM', variantType: 'Baju Olahraga', name: 'Baju Olahraga (Ukuran L)', size: 'L', gradeLevel: 'SEMUA', unitPrice: 150000, currentStock: 28, minStockAlert: 5, totalSold: 18, totalRestocked: 46, description: 'Setelan Kaos & Celana Olahraga Madrasah Ukuran L', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-olr-xl', itemCode: 'SRG-OLR-XL', category: 'SERAGAM', variantType: 'Baju Olahraga', name: 'Baju Olahraga (Ukuran XL)', size: 'XL', gradeLevel: 'SEMUA', unitPrice: 155000, currentStock: 20, minStockAlert: 5, totalSold: 8, totalRestocked: 28, description: 'Setelan Kaos & Celana Olahraga Madrasah Ukuran XL', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-olr-xxl', itemCode: 'SRG-OLR-XXL', category: 'SERAGAM', variantType: 'Baju Olahraga', name: 'Baju Olahraga (Ukuran XXL)', size: 'XXL', gradeLevel: 'SEMUA', unitPrice: 160000, currentStock: 12, minStockAlert: 3, totalSold: 4, totalRestocked: 16, description: 'Setelan Kaos & Celana Olahraga Madrasah Ukuran XXL', createdAt: '2026-08-01T08:00:00.000Z' },

  // Baju Kotak
  { id: 'inv-srg-ktk-s', itemCode: 'SRG-KTK-S', category: 'SERAGAM', variantType: 'Baju Kotak', name: 'Baju Kotak (Ukuran S)', size: 'S', gradeLevel: 'SEMUA', unitPrice: 120000, currentStock: 22, minStockAlert: 5, totalSold: 10, totalRestocked: 32, description: 'Kemeja Seragam Kotak-Kotak Ukuran S', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-ktk-m', itemCode: 'SRG-KTK-M', category: 'SERAGAM', variantType: 'Baju Kotak', name: 'Baju Kotak (Ukuran M)', size: 'M', gradeLevel: 'SEMUA', unitPrice: 120000, currentStock: 26, minStockAlert: 5, totalSold: 14, totalRestocked: 40, description: 'Kemeja Seragam Kotak-Kotak Ukuran M', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-ktk-l', itemCode: 'SRG-KTK-L', category: 'SERAGAM', variantType: 'Baju Kotak', name: 'Baju Kotak (Ukuran L)', size: 'L', gradeLevel: 'SEMUA', unitPrice: 120000, currentStock: 24, minStockAlert: 5, totalSold: 16, totalRestocked: 40, description: 'Kemeja Seragam Kotak-Kotak Ukuran L', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-ktk-xl', itemCode: 'SRG-KTK-XL', category: 'SERAGAM', variantType: 'Baju Kotak', name: 'Baju Kotak (Ukuran XL)', size: 'XL', gradeLevel: 'SEMUA', unitPrice: 125000, currentStock: 18, minStockAlert: 4, totalSold: 7, totalRestocked: 25, description: 'Kemeja Seragam Kotak-Kotak Ukuran XL', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-ktk-xxl', itemCode: 'SRG-KTK-XXL', category: 'SERAGAM', variantType: 'Baju Kotak', name: 'Baju Kotak (Ukuran XXL)', size: 'XXL', gradeLevel: 'SEMUA', unitPrice: 130000, currentStock: 10, minStockAlert: 3, totalSold: 3, totalRestocked: 13, description: 'Kemeja Seragam Kotak-Kotak Ukuran XXL', createdAt: '2026-08-01T08:00:00.000Z' },

  // Rok Kotak
  { id: 'inv-srg-rkt-s', itemCode: 'SRG-RKT-S', category: 'SERAGAM', variantType: 'Rok Kotak', name: 'Rok Kotak (Ukuran S)', size: 'S', gradeLevel: 'SEMUA', unitPrice: 110000, currentStock: 20, minStockAlert: 5, totalSold: 8, totalRestocked: 28, description: 'Rok Seragam Kotak-Kotak Siswi Ukuran S', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-rkt-m', itemCode: 'SRG-RKT-M', category: 'SERAGAM', variantType: 'Rok Kotak', name: 'Rok Kotak (Ukuran M)', size: 'M', gradeLevel: 'SEMUA', unitPrice: 110000, currentStock: 25, minStockAlert: 5, totalSold: 12, totalRestocked: 37, description: 'Rok Seragam Kotak-Kotak Siswi Ukuran M', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-rkt-l', itemCode: 'SRG-RKT-L', category: 'SERAGAM', variantType: 'Rok Kotak', name: 'Rok Kotak (Ukuran L)', size: 'L', gradeLevel: 'SEMUA', unitPrice: 110000, currentStock: 22, minStockAlert: 5, totalSold: 11, totalRestocked: 33, description: 'Rok Seragam Kotak-Kotak Siswi Ukuran L', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-rkt-xl', itemCode: 'SRG-RKT-XL', category: 'SERAGAM', variantType: 'Rok Kotak', name: 'Rok Kotak (Ukuran XL)', size: 'XL', gradeLevel: 'SEMUA', unitPrice: 115000, currentStock: 15, minStockAlert: 4, totalSold: 5, totalRestocked: 20, description: 'Rok Seragam Kotak-Kotak Siswi Ukuran XL', createdAt: '2026-08-01T08:00:00.000Z' },

  // Almamater
  { id: 'inv-srg-alm-s', itemCode: 'SRG-ALM-S', category: 'SERAGAM', variantType: 'Almamater', name: 'Jas Almamater (Ukuran S)', size: 'S', gradeLevel: 'SEMUA', unitPrice: 175000, currentStock: 18, minStockAlert: 4, totalSold: 6, totalRestocked: 24, description: 'Jas Almamater Resmi Madrasah Ukuran S', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-alm-m', itemCode: 'SRG-ALM-M', category: 'SERAGAM', variantType: 'Almamater', name: 'Jas Almamater (Ukuran M)', size: 'M', gradeLevel: 'SEMUA', unitPrice: 175000, currentStock: 25, minStockAlert: 5, totalSold: 12, totalRestocked: 37, description: 'Jas Almamater Resmi Madrasah Ukuran M', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-alm-l', itemCode: 'SRG-ALM-L', category: 'SERAGAM', variantType: 'Almamater', name: 'Jas Almamater (Ukuran L)', size: 'L', gradeLevel: 'SEMUA', unitPrice: 175000, currentStock: 22, minStockAlert: 5, totalSold: 10, totalRestocked: 32, description: 'Jas Almamater Resmi Madrasah Ukuran L', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-alm-xl', itemCode: 'SRG-ALM-XL', category: 'SERAGAM', variantType: 'Almamater', name: 'Jas Almamater (Ukuran XL)', size: 'XL', gradeLevel: 'SEMUA', unitPrice: 185000, currentStock: 14, minStockAlert: 3, totalSold: 4, totalRestocked: 18, description: 'Jas Almamater Resmi Madrasah Ukuran XL', createdAt: '2026-08-01T08:00:00.000Z' },

  // Baju Jurusan
  { id: 'inv-srg-jrs-m', itemCode: 'SRG-JRS-M', category: 'SERAGAM', variantType: 'Baju Jurusan', name: 'Baju Kejuruan / Praktik (Ukuran M)', size: 'M', gradeLevel: 'SEMUA', unitPrice: 135000, currentStock: 24, minStockAlert: 5, totalSold: 8, totalRestocked: 32, description: 'Wearpack / Seragam Jurusan Ukuran M', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-jrs-l', itemCode: 'SRG-JRS-L', category: 'SERAGAM', variantType: 'Baju Jurusan', name: 'Baju Kejuruan / Praktik (Ukuran L)', size: 'L', gradeLevel: 'SEMUA', unitPrice: 135000, currentStock: 20, minStockAlert: 5, totalSold: 9, totalRestocked: 29, description: 'Wearpack / Seragam Jurusan Ukuran L', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-jrs-xl', itemCode: 'SRG-JRS-XL', category: 'SERAGAM', variantType: 'Baju Jurusan', name: 'Baju Kejuruan / Praktik (Ukuran XL)', size: 'XL', gradeLevel: 'SEMUA', unitPrice: 140000, currentStock: 16, minStockAlert: 4, totalSold: 5, totalRestocked: 21, description: 'Wearpack / Seragam Jurusan Ukuran XL', createdAt: '2026-08-01T08:00:00.000Z' },

  // Baju Khas
  { id: 'inv-srg-khs-m', itemCode: 'SRG-KHS-M', category: 'SERAGAM', variantType: 'Baju Khas', name: 'Baju Khas Madrasah (Ukuran M)', size: 'M', gradeLevel: 'SEMUA', unitPrice: 125000, currentStock: 28, minStockAlert: 5, totalSold: 11, totalRestocked: 39, description: 'Baju Khas Identitas Madrasah Ukuran M', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-khs-l', itemCode: 'SRG-KHS-L', category: 'SERAGAM', variantType: 'Baju Khas', name: 'Baju Khas Madrasah (Ukuran L)', size: 'L', gradeLevel: 'SEMUA', unitPrice: 125000, currentStock: 25, minStockAlert: 5, totalSold: 12, totalRestocked: 37, description: 'Baju Khas Identitas Madrasah Ukuran L', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-khs-xl', itemCode: 'SRG-KHS-XL', category: 'SERAGAM', variantType: 'Baju Khas', name: 'Baju Khas Madrasah (Ukuran XL)', size: 'XL', gradeLevel: 'SEMUA', unitPrice: 130000, currentStock: 17, minStockAlert: 4, totalSold: 6, totalRestocked: 23, description: 'Baju Khas Identitas Madrasah Ukuran XL', createdAt: '2026-08-01T08:00:00.000Z' },

  // Baju Batik
  { id: 'inv-srg-btk-s', itemCode: 'SRG-BTK-S', category: 'SERAGAM', variantType: 'Baju Batik', name: 'Baju Batik Madrasah (Ukuran S)', size: 'S', gradeLevel: 'SEMUA', unitPrice: 120000, currentStock: 22, minStockAlert: 5, totalSold: 9, totalRestocked: 31, description: 'Kemeja Batik Identitas Madrasah Ukuran S', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-btk-m', itemCode: 'SRG-BTK-M', category: 'SERAGAM', variantType: 'Baju Batik', name: 'Baju Batik Madrasah (Ukuran M)', size: 'M', gradeLevel: 'SEMUA', unitPrice: 120000, currentStock: 30, minStockAlert: 5, totalSold: 15, totalRestocked: 45, description: 'Kemeja Batik Identitas Madrasah Ukuran M', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-btk-l', itemCode: 'SRG-BTK-L', category: 'SERAGAM', variantType: 'Baju Batik', name: 'Baju Batik Madrasah (Ukuran L)', size: 'L', gradeLevel: 'SEMUA', unitPrice: 120000, currentStock: 27, minStockAlert: 5, totalSold: 13, totalRestocked: 40, description: 'Kemeja Batik Identitas Madrasah Ukuran L', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-btk-xl', itemCode: 'SRG-BTK-XL', category: 'SERAGAM', variantType: 'Baju Batik', name: 'Baju Batik Madrasah (Ukuran XL)', size: 'XL', gradeLevel: 'SEMUA', unitPrice: 125000, currentStock: 19, minStockAlert: 4, totalSold: 7, totalRestocked: 26, description: 'Kemeja Batik Identitas Madrasah Ukuran XL', createdAt: '2026-08-01T08:00:00.000Z' },

  // Baju Muslim
  { id: 'inv-srg-msl-s', itemCode: 'SRG-MSL-S', category: 'SERAGAM', variantType: 'Baju Muslim', name: 'Baju Muslim / Koko Putih (Ukuran S)', size: 'S', gradeLevel: 'SEMUA', unitPrice: 130000, currentStock: 20, minStockAlert: 5, totalSold: 8, totalRestocked: 28, description: 'Busana Muslim / Koko Putih Hari Jumat Ukuran S', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-msl-m', itemCode: 'SRG-MSL-M', category: 'SERAGAM', variantType: 'Baju Muslim', name: 'Baju Muslim / Koko Putih (Ukuran M)', size: 'M', gradeLevel: 'SEMUA', unitPrice: 130000, currentStock: 28, minStockAlert: 5, totalSold: 14, totalRestocked: 42, description: 'Busana Muslim / Koko Putih Hari Jumat Ukuran M', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-msl-l', itemCode: 'SRG-MSL-L', category: 'SERAGAM', variantType: 'Baju Muslim', name: 'Baju Muslim / Koko Putih (Ukuran L)', size: 'L', gradeLevel: 'SEMUA', unitPrice: 130000, currentStock: 25, minStockAlert: 5, totalSold: 13, totalRestocked: 38, description: 'Busana Muslim / Koko Putih Hari Jumat Ukuran L', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-srg-msl-xl', itemCode: 'SRG-MSL-XL', category: 'SERAGAM', variantType: 'Baju Muslim', name: 'Baju Muslim / Koko Putih (Ukuran XL)', size: 'XL', gradeLevel: 'SEMUA', unitPrice: 135000, currentStock: 16, minStockAlert: 4, totalSold: 6, totalRestocked: 22, description: 'Busana Muslim / Koko Putih Hari Jumat Ukuran XL', createdAt: '2026-08-01T08:00:00.000Z' },

  // 2. LKS (Lembar Kerja Siswa)
  { id: 'inv-lks-7-pkt', itemCode: 'LKS-VII-PKT', category: 'LKS', name: 'Paket LKS Lengkap Kelas VII', size: 'Standar', gradeLevel: 'VII', unitPrice: 150000, currentStock: 55, minStockAlert: 10, totalSold: 35, totalRestocked: 90, description: 'Paket 11 Mata Pelajaran Lengkap Semester Ganjil/Genap Kelas VII', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-lks-8-pkt', itemCode: 'LKS-VIII-PKT', category: 'LKS', name: 'Paket LKS Lengkap Kelas VIII', size: 'Standar', gradeLevel: 'VIII', unitPrice: 150000, currentStock: 50, minStockAlert: 10, totalSold: 32, totalRestocked: 82, description: 'Paket 11 Mata Pelajaran Lengkap Semester Ganjil/Genap Kelas VIII', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-lks-9-pkt', itemCode: 'LKS-IX-PKT', category: 'LKS', name: 'Paket LKS Lengkap Kelas IX', size: 'Standar', gradeLevel: 'IX', unitPrice: 150000, currentStock: 45, minStockAlert: 10, totalSold: 28, totalRestocked: 73, description: 'Paket 11 Mata Pelajaran Lengkap Semester Ganjil/Genap Kelas IX', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-lks-7-mtk', itemCode: 'LKS-VII-MTK', category: 'LKS', name: 'LKS Matematika Kelas VII', size: 'Standar', gradeLevel: 'VII', unitPrice: 18000, currentStock: 40, minStockAlert: 8, totalSold: 15, totalRestocked: 55, description: 'Modul LKS Mandiri Matematika Kelas VII', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-lks-7-ipa', itemCode: 'LKS-VII-IPA', category: 'LKS', name: 'LKS IPA Kelas VII', size: 'Standar', gradeLevel: 'VII', unitPrice: 18000, currentStock: 38, minStockAlert: 8, totalSold: 14, totalRestocked: 52, description: 'Modul LKS Mandiri IPA Terpadu Kelas VII', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-lks-7-eng', itemCode: 'LKS-VII-ENG', category: 'LKS', name: 'LKS Bahasa Inggris Kelas VII', size: 'Standar', gradeLevel: 'VII', unitPrice: 18000, currentStock: 35, minStockAlert: 8, totalSold: 12, totalRestocked: 47, description: 'Modul LKS Mandiri Bahasa Inggris Kelas VII', createdAt: '2026-08-01T08:00:00.000Z' },

  // 3. ATRIBUT
  { id: 'inv-atb-dsi', itemCode: 'ATB-DSI', category: 'ATRIBUT', name: 'Dasi Madrasah Bordir Logo', size: 'All Size', gradeLevel: 'SEMUA', unitPrice: 25000, currentStock: 95, minStockAlert: 15, totalSold: 45, totalRestocked: 140, description: 'Dasi resmi bordir logo madrasah', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-atb-topi', itemCode: 'ATB-TPI', category: 'ATRIBUT', name: 'Topi Upacara Madrasah', size: 'All Size', gradeLevel: 'SEMUA', unitPrice: 30000, currentStock: 88, minStockAlert: 15, totalSold: 42, totalRestocked: 130, description: 'Topi pet upacara bordir logo madrasah', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-atb-sbk', itemCode: 'ATB-SBK', category: 'ATRIBUT', name: 'Sabuk / Ikat Pinggang Logo', size: 'Standar', gradeLevel: 'SEMUA', unitPrice: 35000, currentStock: 75, minStockAlert: 10, totalSold: 35, totalRestocked: 110, description: 'Ikat pinggang nilon gesper kuningan logo sekolah', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-atb-bet', itemCode: 'ATB-BET', category: 'ATRIBUT', name: 'Set Bet / Badge Logo & Lokasi', size: 'Standar', gradeLevel: 'SEMUA', unitPrice: 20000, currentStock: 120, minStockAlert: 20, totalSold: 60, totalRestocked: 180, description: 'Set emblem bordir: Logo Kemenag/Madrasah, Nama Lokasi & Bendera Merah Putih', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-atb-kaki', itemCode: 'ATB-KKI', category: 'ATRIBUT', name: 'Kaos Kaki Logo Madrasah (Putih/Hitam)', size: 'Standar', gradeLevel: 'SEMUA', unitPrice: 20000, currentStock: 110, minStockAlert: 20, totalSold: 50, totalRestocked: 160, description: 'Kaos kaki rajut tebal bordir logo madrasah', createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'inv-atb-jlb', itemCode: 'ATB-JLB', category: 'ATRIBUT', name: 'Kerudung / Jilbab Putih Madrasah', size: 'Standar', gradeLevel: 'SEMUA', unitPrice: 45000, currentStock: 65, minStockAlert: 10, totalSold: 30, totalRestocked: 95, description: 'Jilbab segitiga instan putih bordir logo madrasah', createdAt: '2026-08-01T08:00:00.000Z' }
];
