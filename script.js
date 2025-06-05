document.addEventListener('DOMContentLoaded', async () => {
    const modelQualityInput = document.getElementById('model-quality');
    const styleSelect = document.getElementById('style');
    const characterSelect = document.getElementById('character');
    const costumeSelect = document.getElementById('costume');
    const hairFaceSelect = document.getElementById('hair-face');
    const poseActionSelect = document.getElementById('pose-action');
    const lightingTextureSelect = document.getElementById('lighting-texture');
    const angleCompositionSelect = document.getElementById('angle-composition');
    const backgroundSelect = document.getElementById('background');
    const negativePromptInput = document.getElementById('negative-prompt');

    const positivePromptOutput = document.getElementById('positive-prompt-output');
    const negativePromptOutput = document.getElementById('negative-prompt-output');
    const copyPositiveBtn = document.getElementById('copy-positive-btn');
    const copyNegativeBtn = document.getElementById('copy-negative-btn');

    let data = {};

    // JSONデータを読み込み
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        data = await response.json();

        // ドロップダウンリストを埋める
        populateSelect(styleSelect, data.styles, 'name', 'keywords');
        populateSelect(characterSelect, data.characters, 'name', (char) => {
            let keywords = [char.description];
            if (char.features) {
                for (const key in char.features) {
                    if (Array.isArray(char.features[key])) {
                        keywords.push(...char.features[key]);
                    } else {
                        keywords.push(char.features[key]);
                    }
                }
            }
            return keywords.join(', ');
        });
        // 他のカテゴリも同様に追加
        populateSelect(costumeSelect, [{ name: 'None', keywords: '' }], 'name', 'keywords');
        populateSelect(hairFaceSelect, [{ name: 'None', keywords: '' }], 'name', 'keywords');
        populateSelect(poseActionSelect, [{ name: 'None', keywords: '' }], 'name', 'keywords');
        populateSelect(lightingTextureSelect, [{ name: 'None', keywords: '' }], 'name', 'keywords');
        populateSelect(angleCompositionSelect, [{ name: 'None', keywords: '' }], 'name', 'keywords');
        populateSelect(backgroundSelect, data.backgrounds, 'name', 'keywords');

        // キャラクター選択時に衣装の選択肢を更新
        characterSelect.addEventListener('change', () => {
            const selectedCharName = characterSelect.value;
            const selectedChar = data.characters.find(c => c.name === selectedCharName);
            if (selectedChar && selectedChar.costumes) {
                populateSelect(costumeSelect, selectedChar.costumes, 'type', (costume) => {
                    let keywords = [costume.type, costume.color, costume.style];
                    if (costume.details) {
                        keywords.push(...costume.details);
                    }
                    return keywords.join(', ');
                });
            } else {
                populateSelect(costumeSelect, [{ name: 'None', keywords: '' }], 'name', 'keywords');
            }
            updatePrompt();
        });

        // 各入力要素の変更を監視してプロンプトを更新
        modelQualityInput.addEventListener('input', updatePrompt);
        styleSelect.addEventListener('change', updatePrompt);
        characterSelect.addEventListener('change', updatePrompt);
        costumeSelect.addEventListener('change', updatePrompt);
        hairFaceSelect.addEventListener('change', updatePrompt);
        poseActionSelect.addEventListener('change', updatePrompt);
        lightingTextureSelect.addEventListener('change', updatePrompt);
        angleCompositionSelect.addEventListener('change', updatePrompt);
        backgroundSelect.addEventListener('change', updatePrompt);
        negativePromptInput.addEventListener('input', updatePrompt);

        // コピーボタンのイベント
        copyPositiveBtn.addEventListener('click', () => copyToClipboard(positivePromptOutput));
        copyNegativeBtn.addEventListener('click', () => copyToClipboard(negativePromptOutput));

        // 初期プロンプト生成
        updatePrompt();

    } catch (error) {
        console.error("Error loading data:", error);
        positivePromptOutput.textContent = "Error loading data.";
        negativePromptOutput.textContent = "Error loading data.";
    }

    // ドロップダウンリストを埋める関数
    function populateSelect(selectElement, items, nameKey, valueKeyFn) {
        selectElement.innerHTML = ''; // 既存のオプションをクリア
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'None';
        selectElement.appendChild(defaultOption);

        items.forEach(item => {
            const option = document.createElement('option');
            option.value = typeof valueKeyFn === 'function' ? valueKeyFn(item) : item[valueKeyFn];
            option.textContent = item[nameKey];
            selectElement.appendChild(option);
        });
    }

    // プロンプトの更新関数
    function updatePrompt() {
        let positivePromptParts = [];
        let negativePromptParts = [];

        // モデル・クオリティ
        const modelQuality = modelQualityInput.value.trim();
        if (modelQuality) {
            positivePromptParts.push(modelQuality);
        }

        // スタイル
        const selectedStyleName = styleSelect.value;
        if (selectedStyleName) {
            const selectedStyle = data.styles.find(s => s.name === selectedStyleName);
            if (selectedStyle && selectedStyle.keywords) {
                positivePromptParts.push(...selectedStyle.keywords);
            }
        }

        // キャラクター・属性
        const selectedCharName = characterSelect.value;
        if (selectedCharName) {
            const selectedChar = data.characters.find(c => c.name === selectedCharName);
            if (selectedChar) {
                if (selectedChar.description) {
                    positivePromptParts.push(selectedChar.description);
                }
                if (selectedChar.features) {
                    for (const key in selectedChar.features) {
                        if (Array.isArray(selectedChar.features[key])) {
                            positivePromptParts.push(...selectedChar.features[key]);
                        } else {
                            positivePromptParts.push(selectedChar.features[key]);
                        }
                    }
                }
            }
        }

        // 衣装・装飾
        const selectedCostumeKeywords = costumeSelect.value;
        if (selectedCostumeKeywords) {
            positivePromptParts.push(...selectedCostumeKeywords.split(',').map(k => k.trim()).filter(k => k));
        }

        // ヘア・フェイス
        const selectedHairFaceKeywords = hairFaceSelect.value;
        if (selectedHairFaceKeywords) {
            positivePromptParts.push(...selectedHairFaceKeywords.split(',').map(k => k.trim()).filter(k => k));
        }

        // ポーズ・動き・アクション
        const selectedPoseActionKeywords = poseActionSelect.value;
        if (selectedPoseActionKeywords) {
            positivePromptParts.push(...selectedPoseActionKeywords.split(',').map(k => k.trim()).filter(k => k));
        }

        // ライティング・質感
        const selectedLightingTextureKeywords = lightingTextureSelect.value;
        if (selectedLightingTextureKeywords) {
            positivePromptParts.push(...selectedLightingTextureKeywords.split(',').map(k => k.trim()).filter(k => k));
        }

        // アングル・構図
        const selectedAngleCompositionKeywords = angleCompositionSelect.value;
        if (selectedAngleCompositionKeywords) {
            positivePromptParts.push(...selectedAngleCompositionKeywords.split(',').map(k => k.trim()).filter(k => k));
        }

        // 背景
        const selectedBackgroundName = backgroundSelect.value;
        if (selectedBackgroundName) {
            const selectedBackground = data.backgrounds.find(b => b.name === selectedBackgroundName);
            if (selectedBackground && selectedBackground.keywords) {
                positivePromptParts.push(...selectedBackground.keywords);
            }
        }

        // ネガティブプロンプト
        const negativePromptText = negativePromptInput.value.trim();
        if (negativePromptText) {
            negativePromptParts.push(...negativePromptText.split(',').map(k => k.trim()).filter(k => k));
        }

        // 重複を削除してカンマ区切りで結合
        const finalPositivePrompt = [...new Set(positivePromptParts)].join(', ');
        const finalNegativePrompt = [...new Set(negativePromptParts)].join(', ');

        positivePromptOutput.textContent = finalPositivePrompt;
        negativePromptOutput.textContent = finalNegativePrompt;
    }

    // クリップボードにコピーする関数
    function copyToClipboard(element) {
        navigator.clipboard.writeText(element.textContent).then(() => {
            console.log('Copied to clipboard successfully');
            // 成功通知を表示（オプション）
            alert('コピーしました!');
        }).catch(err => {
            console.error('Failed to copy text:', err);
            // 失敗通知を表示（オプション）
            alert('コピーに失敗しました...');
        });
    }
});